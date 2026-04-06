import { useState, useCallback, useMemo } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check, Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getBudgetCategories } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ParsedLine {
  name: string;
  amount: number;
  mappedCategory: string;
  autoMatched: boolean;
  aiMatched?: boolean;
  confidence?: number;
}

interface ImportBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (budgets: Record<string, number>) => void;
}

// Build a lookup of keywords → category values for auto-matching
function buildCategoryLookup() {
  const cats = getBudgetCategories();
  const map: { keywords: string[]; value: string }[] = [];

  const aliases: Record<string, string[]> = {
    flooring: ['flooring', 'floor', 'lvp', 'hardwood', 'carpet'],
    painting: ['paint', 'painting', 'primer', 'interior paint', 'exterior paint'],
    electrical: ['electrical', 'electric', 'wiring', 'panel', 'breaker'],
    plumbing: ['plumbing', 'plumber', 'pipe', 'rough-in plumbing', 'plumbing rough'],
    hvac: ['hvac', 'mechanical', 'ac', 'air condition', 'condenser', 'furnace', 'ductwork', 'mini split'],
    roofing: ['roofing', 'roof', 'shingle', 'roof tear', 'reroof'],
    drywall: ['drywall', 'sheetrock', 'drywall package', 'drywall labor', 'drywall hang', 'drywall finish', 'drywall tape'],
    insulation: ['insulation', 'batt', 'blown', 'spray foam'],
    framing: ['framing', 'framer', 'lumber', 'lumber package', 'framing labor', 'framing package', 'structural framing'],
    foundation_repair: ['foundation', 'foundation repair', 'pier', 'underpinning'],
    cabinets: ['cabinets', 'cabinet', 'cabinet install'],
    countertops: ['countertops', 'countertop', 'granite', 'quartz'],
    tile: ['tile', 'tiling', 'backsplash', 'shower tile'],
    appliances: ['appliances', 'appliance', 'refrigerator', 'stove', 'dishwasher', 'range', 'microwave', 'washer', 'dryer'],
    windows: ['windows', 'window', 'window install', 'window replacement'],
    doors: ['doors', 'door', 'exterior door', 'exterior doors', 'interior door', 'interior doors', 'entry door'],
    fencing: ['fencing', 'fence', 'gate'],
    landscaping: ['landscaping', 'landscape', 'sod', 'irrigation', 'sprinkler', 'yard'],
    driveway_concrete: ['driveway', 'concrete', 'sidewalk', 'concrete work', 'flatwork', 'patio concrete'],
    demolition: ['demolition', 'demo', 'tear out', 'tearout', 'selective demo'],
    permits: ['permits', 'permit', 'tap fee', 'survey', 'structural', 'civil engineering', 'civil', 'engineering', 'architecture', 'architect', 'plans', 'plan review', 'impact fee'],
    inspections: ['inspection', 'inspections', 'energy', 'energy audit', 'energy compliance'],
    pest_control: ['termite', 'pest', 'termite treatment', 'pest control', 'termite bond'],
    dumpsters_trash: ['dumpster', 'trash', 'hauling', 'debris', 'trash hauling', 'debris removal'],
    cleaning: ['clean', 'final clean', 'construction clean', 'cleaning', 'maid'],
    final_punch: ['punch', 'punch out', 'punch list', 'final punch'],
    brick_siding_stucco: ['siding', 'stucco', 'brick', 'exterior finish', 'hardie', 'hardy board'],
    garage: ['garage', 'garage door', 'garage door opener'],
    light_fixtures: ['fixture', 'light fixture', 'lighting', 'light fixtures', 'recessed light', 'can light'],
    carpentry: ['trim', 'trim out', 'trims', 'carpentry', 'molding', 'baseboard', 'crown', 'casing', 'trim package'],
    water_heater: ['water heater', 'hot water', 'tankless'],
    utilities: ['utilities', 'utility', 'temporary util', 'temp utilities'],
    misc: ['misc', 'miscellaneous', 'site work', 'general conditions', 'general'],
    railing: ['railing', 'rail', 'handrail', 'stair rail', 'iron railing'],
    natural_gas: ['gas line', 'natural gas', 'gas piping'],
    pool: ['pool', 'pool plaster', 'pool equipment'],
    staging: ['staging', 'stage'],
    kitchen: ['kitchen', 'kitchen remodel'],
    bathroom: ['bathroom', 'bath', 'bath remodel'],
    main_bathroom: ['master bath', 'main bath', 'master bathroom'],
    hardware: ['hardware', 'door hardware', 'cabinet hardware'],
    hoa: ['hoa', 'homeowner association'],
    insurance_project: ['insurance', 'builder risk', 'builders risk'],
    taxes: ['tax', 'taxes', 'property tax'],
    closing_costs: ['closing cost', 'closing costs', 'title', 'escrow'],
    drain_line_repair: ['drain line', 'sewer', 'sewer line', 'drain'],
  };

  for (const cat of cats) {
    const kws = aliases[cat.value] || [cat.label.toLowerCase()];
    map.push({ keywords: kws, value: cat.value });
  }
  return map;
}

function autoMatch(name: string, lookup: { keywords: string[]; value: string }[]): string | null {
  const lower = name.toLowerCase().trim();
  for (const entry of lookup) {
    for (const kw of entry.keywords) {
      if (lower === kw) return entry.value;
    }
  }
  for (const entry of lookup) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw) || kw.includes(lower)) return entry.value;
    }
  }
  const tokens = lower.split(/[\s/&,\-–—]+/).filter(Boolean);
  for (const entry of lookup) {
    for (const kw of entry.keywords) {
      const kwTokens = kw.split(/\s+/);
      if (kwTokens.length === 1 && tokens.includes(kwTokens[0])) return entry.value;
    }
  }
  return null;
}

const JUNK_ROW_PATTERNS = /\b(subtotal|sub total|all[- ]in total|totals?$|project inputs|financing costs?|ebt|roi|arv|ltc|delivery|sale \(\$|cost category|quantity|notes|total cost|\$\/sqft|formula:|grand total|section total)\b/i;
const HEADER_PATTERNS = /\b(category|description|item|line item|cost category|budget|qty|quantity|unit|unit price|total cost|notes|comments)\b/i;

function isHeaderRow(parts: string[]): boolean {
  const joined = parts.join(' ').toLowerCase();
  const headerHits = (joined.match(new RegExp(HEADER_PATTERNS.source, 'gi')) || []).length;
  return headerHits >= 2;
}

function parseCSVText(text: string): { name: string; amount: number }[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results: { name: string; amount: number }[] = [];

  for (const line of lines) {
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length < 2) continue;
    if (isHeaderRow(parts)) continue;

    const name = parts[0].trim();
    if (!name) continue;
    if (JUNK_ROW_PATTERNS.test(line)) continue;

    const numericValues: { value: number; index: number }[] = [];
    for (let i = 1; i < parts.length; i++) {
      const cleaned = parts[i].trim().replace(/[$,]/g, '');
      if (parts[i].trim().includes('%')) continue;
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        numericValues.push({ value: num, index: i });
      }
    }

    if (numericValues.length === 0) continue;

    let amount = 0;
    const bigValues = numericValues.filter(n => Math.abs(n.value) > 10);
    if (bigValues.length > 0) {
      amount = bigValues.reduce((best, n) => Math.abs(n.value) > Math.abs(best.value) ? n : best).value;
    } else {
      amount = numericValues.reduce((best, n) => Math.abs(n.value) > Math.abs(best.value) ? n : best).value;
    }

    if (Math.abs(amount) < 1) continue;
    if (/\$\s*\/\s*sq\s*ft/i.test(name) || /per\s*sq\s*ft/i.test(name)) continue;

    results.push({ name, amount: Math.abs(amount) });
  }

  return results;
}

export function ImportBudgetModal({ open, onOpenChange, onImport }: ImportBudgetModalProps) {
  const [step, setStep] = useState<'upload' | 'map'>('upload');
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
  const [rawText, setRawText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const categories = useMemo(() => getBudgetCategories(), []);
  const lookup = useMemo(() => buildCategoryLookup(), []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      processTextLocal(text);
    };
    reader.readAsText(file);
  }, [lookup]);

  const processTextLocal = useCallback((text: string) => {
    const items = parseCSVText(text);
    if (items.length === 0) {
      toast.error('No budget items found. Paste data as: Category, Amount');
      return;
    }
    const lines: ParsedLine[] = items.map(item => {
      const match = autoMatch(item.name, lookup);
      return {
        name: item.name,
        amount: item.amount,
        mappedCategory: match || 'rehab_filler',
        autoMatched: !!match,
      };
    });
    setParsedLines(lines);
    setStep('map');
  }, [lookup]);

  const processTextAI = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast.error('Paste your budget data first');
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('clean-budget-import', {
        body: { rawText: text },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const items = data?.items;
      if (!items || items.length === 0) {
        toast.error('AI could not parse any items. Try the manual process instead.');
        setAiLoading(false);
        return;
      }

      const lines: ParsedLine[] = items.map((item: any) => ({
        name: item.name,
        amount: item.amount,
        mappedCategory: item.category,
        autoMatched: true,
        aiMatched: true,
        confidence: item.confidence,
      }));

      setParsedLines(lines);
      setStep('map');
      toast.success(`AI cleaned ${lines.length} items`);
    } catch (err: any) {
      console.error('AI clean error:', err);
      toast.error('AI cleaning failed — falling back to manual parse');
      processTextLocal(text);
    } finally {
      setAiLoading(false);
    }
  }, [processTextLocal]);

  const handlePasteProcess = () => {
    if (!rawText.trim()) {
      toast.error('Paste your budget data first');
      return;
    }
    processTextLocal(rawText);
  };

  const handleSmartClean = () => {
    if (!rawText.trim()) {
      toast.error('Paste your budget data first');
      return;
    }
    processTextAI(rawText);
  };

  const handleCategoryChange = (index: number, value: string) => {
    setParsedLines(prev => prev.map((line, i) =>
      i === index ? { ...line, mappedCategory: value, autoMatched: false, aiMatched: false } : line
    ));
  };

  const handleImport = () => {
    const budgets: Record<string, number> = {};
    for (const line of parsedLines) {
      budgets[line.mappedCategory] = (budgets[line.mappedCategory] || 0) + line.amount;
    }
    onImport(budgets);
    onOpenChange(false);
    setStep('upload');
    setParsedLines([]);
    setRawText('');
    toast.success(`Imported ${parsedLines.length} line items into budget`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('upload');
    setParsedLines([]);
    setRawText('');
  };

  const unmatchedCount = parsedLines.filter(l => l.mappedCategory === 'rehab_filler' && !l.autoMatched && !l.aiMatched).length;
  const lowConfidenceCount = parsedLines.filter(l => l.aiMatched && (l.confidence ?? 1) < 0.7).length;
  const totalImportAmount = parsedLines.reduce((s, l) => s + l.amount, 0);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {step === 'upload' ? 'Import Budget' : 'Map Categories'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload'
              ? 'Upload a CSV or paste budget data from a spreadsheet'
              : `${parsedLines.length} items found — ${fmt(totalImportAmount)} total. Review category mappings below.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-3">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload a CSV file</p>
              <Input
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or paste from spreadsheet</span>
              </div>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"Site Work\t$5,250\nDumpsters\t$2,750\nFoundation\t$23,100\nFraming Labor\t$15,240\n..."}
              className="w-full h-40 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePasteProcess}
                className="flex-1"
                disabled={!rawText.trim() || aiLoading}
              >
                Process Manually
              </Button>
              <Button
                onClick={handleSmartClean}
                className="flex-1 gap-2"
                disabled={!rawText.trim() || aiLoading}
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiLoading ? 'Cleaning…' : 'Smart Clean'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Smart Clean uses AI to normalize names, merge duplicates, and auto-map categories
            </p>
          </div>
        )}

        {step === 'map' && (
          <>
            {(unmatchedCount > 0 || lowConfidenceCount > 0) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  {unmatchedCount > 0 && `${unmatchedCount} unmatched`}
                  {unmatchedCount > 0 && lowConfidenceCount > 0 && ', '}
                  {lowConfidenceCount > 0 && `${lowConfidenceCount} low-confidence`}
                  {' — review highlighted rows'}
                </span>
              </div>
            )}

            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr,100px,180px] gap-2 text-xs font-medium text-muted-foreground px-1 pb-1 border-b">
                  <span>Item</span>
                  <span className="text-right">Amount</span>
                  <span>Category</span>
                </div>

                {parsedLines.map((line, idx) => {
                  const isLowConfidence = line.aiMatched && (line.confidence ?? 1) < 0.7;
                  const isUnmatched = line.mappedCategory === 'rehab_filler' && !line.autoMatched && !line.aiMatched;

                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-[1fr,100px,180px] gap-2 items-center px-1 py-1.5 rounded-sm ${
                        isUnmatched || isLowConfidence ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {line.aiMatched ? (
                          <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-4 bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30">
                            AI
                          </Badge>
                        ) : line.autoMatched ? (
                          <Check className="h-3 w-3 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                        <span className="text-sm truncate">{line.name}</span>
                      </div>
                      <span className="text-sm font-mono text-right">{fmt(line.amount)}</span>
                      <Select
                        value={line.mappedCategory}
                        onValueChange={(v) => handleCategoryChange(idx, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value} className="text-xs">
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="flex justify-between sm:justify-between gap-2">
              <Button variant="ghost" onClick={() => { setStep('upload'); setParsedLines([]); }}>
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-mono">{fmt(totalImportAmount)}</span>
                <Button onClick={handleImport}>
                  Import {parsedLines.length} Items
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

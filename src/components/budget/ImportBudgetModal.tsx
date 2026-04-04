import { useState, useCallback, useMemo } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getBudgetCategories } from '@/types';

interface ParsedLine {
  name: string;
  amount: number;
  mappedCategory: string; // category value or 'rehab_filler'
  autoMatched: boolean;
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
    painting: ['paint', 'painting', 'primer'],
    electrical: ['electrical', 'electric', 'wiring'],
    plumbing: ['plumbing', 'plumber', 'pipe'],
    hvac: ['hvac', 'mechanical', 'ac', 'air condition', 'condenser', 'furnace'],
    roofing: ['roofing', 'roof', 'shingle'],
    drywall: ['drywall', 'sheetrock'],
    insulation: ['insulation', 'batt', 'blown'],
    framing: ['framing', 'framer', 'lumber', 'lumber package'],
    foundation_repair: ['foundation'],
    cabinets: ['cabinets', 'cabinet'],
    countertops: ['countertops', 'countertop', 'granite', 'quartz'],
    tile: ['tile', 'tiling', 'backsplash'],
    appliances: ['appliances', 'appliance', 'refrigerator', 'stove', 'dishwasher'],
    windows: ['windows', 'window'],
    doors: ['doors', 'door', 'exterior door'],
    fencing: ['fencing', 'fence'],
    landscaping: ['landscaping', 'landscape', 'sod', 'irrigation'],
    driveway_concrete: ['driveway', 'concrete', 'sidewalk'],
    demolition: ['demolition', 'demo'],
    permits: ['permits', 'permit', 'tap fee'],
    pest_control: ['termite', 'pest'],
    dumpsters_trash: ['dumpster', 'trash', 'hauling', 'debris'],
    cleaning: ['clean', 'final clean'],
    final_punch: ['punch', 'punch out'],
    brick_siding_stucco: ['siding', 'stucco', 'brick', 'exterior finish'],
    garage: ['garage', 'garage door'],
    light_fixtures: ['fixture', 'light fixture', 'lighting'],
    carpentry: ['trim', 'trim out', 'trims', 'carpentry', 'molding', 'baseboard'],
    water_heater: ['water heater', 'hot water'],
    utilities: ['utilities', 'utility', 'temporary util'],
    misc: ['misc', 'miscellaneous', 'site work'],
    railing: ['railing', 'rail', 'handrail'],
    natural_gas: ['gas line', 'natural gas'],
    pool: ['pool'],
    staging: ['staging'],
    kitchen: ['kitchen'],
    bathroom: ['bathroom', 'bath'],
    main_bathroom: ['master bath', 'main bath'],
    hardware: ['hardware'],
    hoa: ['hoa'],
    insurance_project: ['insurance'],
    taxes: ['tax', 'taxes'],
    closing_costs: ['closing cost'],
    drain_line_repair: ['drain line', 'sewer'],
  };

  for (const cat of cats) {
    const kws = aliases[cat.value] || [cat.label.toLowerCase()];
    map.push({ keywords: kws, value: cat.value });
  }
  return map;
}

function autoMatch(name: string, lookup: { keywords: string[]; value: string }[]): string | null {
  const lower = name.toLowerCase().trim();
  // Exact label match first
  for (const entry of lookup) {
    for (const kw of entry.keywords) {
      if (lower === kw) return entry.value;
    }
  }
  // Partial match
  for (const entry of lookup) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw) || kw.includes(lower)) return entry.value;
    }
  }
  return null;
}

function parseCSVText(text: string): { name: string; amount: number }[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results: { name: string; amount: number }[] = [];

  for (const line of lines) {
    // Try tab-separated first, then comma
    const parts = line.includes('\t') ? line.split('\t') : line.split(',');
    if (parts.length < 2) continue;

    // Find the amount - look for numeric values
    let name = '';
    let amount = 0;
    let foundAmount = false;

    for (let i = parts.length - 1; i >= 0; i--) {
      const cleaned = parts[i].trim().replace(/[$,]/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > 0 && !foundAmount) {
        amount = num;
        foundAmount = true;
      }
    }

    // Name is the first non-empty non-numeric part
    name = parts[0].trim();

    // Skip header-like rows and total rows
    const lowerName = name.toLowerCase();
    if (!name || !foundAmount) continue;
    if (lowerName === 'category' || lowerName === 'cost category' || lowerName === 'total' || lowerName === 'total cost') continue;
    if (lowerName.startsWith('phase ') || lowerName.startsWith('hard cost') || lowerName.startsWith('soft cost')) continue;

    results.push({ name, amount });
  }

  return results;
}

export function ImportBudgetModal({ open, onOpenChange, onImport }: ImportBudgetModalProps) {
  const [step, setStep] = useState<'upload' | 'map'>('upload');
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
  const [rawText, setRawText] = useState('');

  const categories = useMemo(() => getBudgetCategories(), []);
  const lookup = useMemo(() => buildCategoryLookup(), []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      processText(text);
    };
    reader.readAsText(file);
  }, [lookup]);

  const processText = useCallback((text: string) => {
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

  const handlePasteProcess = () => {
    if (!rawText.trim()) {
      toast.error('Paste your budget data first');
      return;
    }
    processText(rawText);
  };

  const handleCategoryChange = (index: number, value: string) => {
    setParsedLines(prev => prev.map((line, i) =>
      i === index ? { ...line, mappedCategory: value, autoMatched: false } : line
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

  const unmatchedCount = parsedLines.filter(l => l.mappedCategory === 'rehab_filler' && !l.autoMatched).length;
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

            <Button onClick={handlePasteProcess} className="w-full" disabled={!rawText.trim()}>
              Process Pasted Data
            </Button>
          </div>
        )}

        {step === 'map' && (
          <>
            {unmatchedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{unmatchedCount} item{unmatchedCount > 1 ? 's' : ''} unmatched — assign a category or leave as Contingency</span>
              </div>
            )}

            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr,100px,180px] gap-2 text-xs font-medium text-muted-foreground px-1 pb-1 border-b">
                  <span>Item</span>
                  <span className="text-right">Amount</span>
                  <span>Category</span>
                </div>

                {parsedLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-[1fr,100px,180px] gap-2 items-center px-1 py-1.5 rounded-sm ${
                      line.mappedCategory === 'rehab_filler' && !line.autoMatched
                        ? 'bg-amber-500/5'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {line.autoMatched ? (
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
                ))}
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

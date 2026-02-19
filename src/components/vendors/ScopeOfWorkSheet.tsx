import { useState, useEffect } from 'react';
import { Loader2, Copy, Check, Trash2, FileText, Sparkles, Download } from 'lucide-react';
import { generatePDF } from '@/lib/pdfExport';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Vendor {
  id: string;
  name: string;
  trades: string[];
  phone: string | null;
  email: string | null;
  has_w9: boolean;
  reliability_rating: number | null;
  pricing_model: 'flat' | 'hourly' | null;
  notes: string | null;
}

interface ScopeOfWorkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
}

type ScopeLength = 'brief' | 'standard' | 'detailed';
type Tone = 'simple' | 'standard' | 'professional';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{children}</p>
      <Separator className="mt-1.5" />
    </div>
  );
}

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex gap-1.5 p-1 rounded-lg bg-muted">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-1.5 text-sm rounded-md font-medium transition-all duration-150',
            value === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ScopeOfWorkSheet({ open, onOpenChange, vendors }: ScopeOfWorkSheetProps) {
  const { toast } = useToast();
  const { settings } = useCompanySettings();

  // Vendor selection
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Document Info
  const [companyName, setCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobNumber, setJobNumber] = useState('');

  // Job Details
  const [tradeTypes, setTradeTypes] = useState<string[]>([]);
  const [tradeInput, setTradeInput] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [keyQuantities, setKeyQuantities] = useState('');

  // Scope of Work
  const [workItems, setWorkItems] = useState('');
  const [alsoIncluded, setAlsoIncluded] = useState('');
  const [exclusions, setExclusions] = useState('');

  // Materials & Notes
  const [materialsResponsibility, setMaterialsResponsibility] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Output settings
  const [scopeLength, setScopeLength] = useState<ScopeLength>('standard');
  const [tone, setTone] = useState<Tone>('standard');

  // Result
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScope, setGeneratedScope] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  // Pre-fill company name from settings
  useEffect(() => {
    if (settings?.company_name) {
      setCompanyName(settings.company_name);
    }
  }, [settings]);

  // Auto-fill trades when vendor changes
  useEffect(() => {
    if (selectedVendor) {
      setTradeTypes(selectedVendor.trades);
    } else {
      setTradeTypes([]);
    }
  }, [selectedVendor]);

  // Reset on close
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setSelectedVendorId('');
      setCustomerName('');
      setDate(new Date().toISOString().split('T')[0]);
      setJobNumber('');
      setTradeTypes([]);
      setTradeInput('');
      setJobTitle('');
      setLocation('');
      setKeyQuantities('');
      setWorkItems('');
      setAlsoIncluded('');
      setExclusions('');
      setMaterialsResponsibility('');
      setSpecialNotes('');
      setScopeLength('standard');
      setTone('standard');
      setGeneratedScope('');
      setCopied(false);
    }
    onOpenChange(val);
  };

  const removeTrade = (trade: string) => setTradeTypes((prev) => prev.filter((t) => t !== trade));

  const addTrade = () => {
    const trimmed = tradeInput.trim();
    if (trimmed && !tradeTypes.includes(trimmed)) {
      setTradeTypes((prev) => [...prev, trimmed]);
    }
    setTradeInput('');
  };

  const handleGenerate = async () => {
    if (!selectedVendorId) return;
    setIsGenerating(true);
    setGeneratedScope('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-scope-of-work', {
        body: {
          vendorName: selectedVendor?.name,
          companyName,
          customerName,
          date,
          jobNumber,
          tradeTypes,
          jobTitle,
          location,
          keyQuantities,
          workItems,
          alsoIncluded,
          exclusions,
          materialsResponsibility,
          specialNotes,
          scopeLength,
          tone,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }

      setGeneratedScope(data?.scope || '');
    } catch (err: any) {
      toast({
        title: 'Generation failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedScope);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Scope of work copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Scope of Work Generator</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">AI-powered construction document</p>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable form body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-7">

            {/* VENDOR SELECTION */}
            <div>
              <SectionLabel>Vendor</SectionLabel>
              <div className="space-y-1.5">
                <Label>Select Vendor <span className="text-destructive">*</span></Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a vendor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* DOCUMENT INFO */}
            <div>
              <SectionLabel>Document Info <span className="normal-case font-normal text-muted-foreground/70">(optional)</span></SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
                </div>
                <div className="space-y-1.5">
                  <Label>Customer / Property</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. 123 Main St" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Quote / Job Number</Label>
                  <Input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} placeholder="e.g. JOB-2025-001" />
                </div>
              </div>
            </div>

            {/* JOB DETAILS */}
            <div>
              <SectionLabel>Job Details</SectionLabel>
              <div className="space-y-3">
                {/* Trade type chips */}
                <div className="space-y-1.5">
                  <Label>Trade Types</Label>
                  <div className="min-h-[40px] flex flex-wrap gap-1.5 p-2 border rounded-md bg-background">
                    {tradeTypes.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => removeTrade(t)}
                      >
                        {t}
                        <span className="text-xs">×</span>
                      </Badge>
                    ))}
                    {tradeTypes.length === 0 && (
                      <span className="text-xs text-muted-foreground self-center">Select a vendor to auto-fill trades, or add below</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tradeInput}
                      onChange={(e) => setTradeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTrade())}
                      placeholder="Add trade type…"
                      className="text-sm"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTrade} className="shrink-0">Add</Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Job Title</Label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Water heater replacement" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Location / Area</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Garage, Back yard" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Key Quantities</Label>
                    <Input value={keyQuantities} onChange={(e) => setKeyQuantities(e.target.value)} placeholder="e.g. 2 fixtures, 3 units" />
                  </div>
                </div>
              </div>
            </div>

            {/* SCOPE OF WORK */}
            <div>
              <SectionLabel>Scope of Work</SectionLabel>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Work Items</Label>
                  <p className="text-xs text-muted-foreground -mt-0.5">List each task on its own line</p>
                  <Textarea
                    value={workItems}
                    onChange={(e) => setWorkItems(e.target.value)}
                    placeholder={"Remove old water heater\nInstall new 50-gallon unit\nConnect gas and water lines\nTest all connections"}
                    className="min-h-[100px] resize-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Also Included</Label>
                  <Textarea
                    value={alsoIncluded}
                    onChange={(e) => setAlsoIncluded(e.target.value)}
                    placeholder={"Debris removal\nFinal cleanup\nHaul-away of old unit"}
                    className="min-h-[72px] resize-none text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Not Included / Exclusions</Label>
                  <Textarea
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    placeholder={"Permits\nStructural modifications\nDrywall repairs"}
                    className="min-h-[72px] resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* MATERIALS & NOTES */}
            <div>
              <SectionLabel>Materials & Notes</SectionLabel>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Materials Responsibility</Label>
                  <Select value={materialsResponsibility} onValueChange={setMaterialsResponsibility}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select responsibility…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contractor provides all materials">Contractor provides all materials</SelectItem>
                      <SelectItem value="Owner provides all materials">Owner provides all materials</SelectItem>
                      <SelectItem value="Split — see notes">Split — see notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Special Notes</Label>
                  <Textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Access instructions, scheduling notes, special requirements…"
                    className="min-h-[72px] resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* OUTPUT SETTINGS */}
            <div>
              <SectionLabel>Output Settings</SectionLabel>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Scope Length</Label>
                  <ToggleGroup
                    value={scopeLength}
                    onChange={(v) => setScopeLength(v as ScopeLength)}
                    options={[
                      { value: 'brief', label: 'Brief' },
                      { value: 'standard', label: 'Standard' },
                      { value: 'detailed', label: 'Detailed' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tone</Label>
                  <ToggleGroup
                    value={tone}
                    onChange={(v) => setTone(v as Tone)}
                    options={[
                      { value: 'simple', label: 'Simple' },
                      { value: 'standard', label: 'Standard' },
                      { value: 'professional', label: 'Professional' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedVendorId || isGenerating}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Scope of Work
                </>
              )}
            </Button>

            {/* GENERATED OUTPUT */}
            {generatedScope && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Generated Document</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-7 text-xs">
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePDF(generatedScope, {
                        docType: 'Scope of Work',
                        companyName: settings?.company_name || 'Your Company',
                        logoUrl: settings?.logo_url,
                      })}
                      className="gap-1.5 h-7 text-xs"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setGeneratedScope('')}
                      className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/40 border rounded-lg p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground/90 max-h-[500px] overflow-y-auto">
                  {generatedScope}
                </div>
              </div>
            )}

            {/* Bottom padding */}
            <div className="h-4" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

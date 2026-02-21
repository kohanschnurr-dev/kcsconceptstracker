import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { generatePDF } from '@/lib/pdfExport';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { WorkItemLines, type WorkItem } from '@/components/vendors/WorkItemLines';
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

interface ScopeOfWorkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{children}</p>
      <Separator className="mt-1.5" />
    </div>
  );
}

export function ScopeOfWorkSheet({ open, onOpenChange }: ScopeOfWorkSheetProps) {
  const { toast } = useToast();
  const { settings } = useCompanySettings();

  const [recipientName, setRecipientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [jobNumber, setJobNumber] = useState('');
  const [tradeTypes, setTradeTypes] = useState<string[]>([]);
  const [tradeInput, setTradeInput] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [keyQuantities, setKeyQuantities] = useState('');
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [alsoIncluded, setAlsoIncluded] = useState<WorkItem[]>([]);
  const [exclusions, setExclusions] = useState<WorkItem[]>([]);
  const [materialsResponsibility, setMaterialsResponsibility] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  useEffect(() => {
    if (settings?.company_name) setCompanyName(settings.company_name);
  }, [settings]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setRecipientName('');
      setCustomerName('');
      setDate(new Date().toISOString().split('T')[0]);
      setJobNumber('');
      setTradeTypes([]);
      setTradeInput('');
      setJobTitle('');
      setLocation('');
      setKeyQuantities('');
      setWorkItems([]);
      setAlsoIncluded([]);
      setExclusions([]);
      setMaterialsResponsibility('');
      setSpecialNotes('');
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

  const handleGenerate = () => {
    const lines: string[] = ['SCOPE OF WORK', ''];

    if (companyName) lines.push(`Company: ${companyName}`);
    if (recipientName) lines.push(`Recipient: ${recipientName}`);
    if (customerName) lines.push(`Customer: ${customerName}`);
    if (date) lines.push(`Date: ${date}`);
    if (jobNumber) lines.push(`Job Number: ${jobNumber}`);

    if (tradeTypes.length > 0) {
      lines.push('', 'TRADE / TRADE TYPE');
      lines.push(tradeTypes.join(', '));
    }

    if (jobTitle) {
      lines.push('', 'JOB TITLE');
      lines.push(jobTitle);
    }

    if (location) {
      lines.push('', 'LOCATION / AREA');
      lines.push(location);
    }

    if (keyQuantities) {
      lines.push('', 'KEY QUANTITIES');
      lines.push(keyQuantities);
    }

    const workText = workItems.map((i) => i.text).filter(Boolean).join('\n');
    if (workText) {
      lines.push('', 'WORK TO BE PERFORMED');
      lines.push(workText);
    }

    const alsoText = alsoIncluded.map((i) => i.text).filter(Boolean).join('\n');
    if (alsoText) {
      lines.push('', 'ALSO INCLUDED');
      lines.push(alsoText);
    }

    const exclText = exclusions.map((i) => i.text).filter(Boolean).join('\n');
    if (exclText) {
      lines.push('', 'NOT INCLUDED / EXCLUSIONS');
      lines.push(exclText);
    }

    if (materialsResponsibility) {
      lines.push('', 'MATERIALS');
      lines.push(materialsResponsibility);
    }

    if (specialNotes.trim()) {
      lines.push('', 'SPECIAL NOTES');
      lines.push(specialNotes.trim());
    }

    const content = lines.join('\n');
    generatePDF(content, {
      docType: 'Scope of Work',
      companyName: settings?.company_name || companyName || 'Your Company',
      logoUrl: settings?.logo_url,
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Scope of Work Generator</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Build a construction document PDF</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-7">

            {/* DOCUMENT INFO */}
            <div>
              <SectionLabel>Document Info</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your company" />
                </div>
                <div className="space-y-1.5">
                  <Label>Recipient</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. John Smith, ABC Construction" />
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
              <div className="space-y-5">
                <WorkItemLines
                  items={workItems}
                  onChange={setWorkItems}
                  label="Work Items"
                  description="Add each task as its own line — attach photos per item"
                  placeholder="e.g. Remove old water heater"
                />
                <WorkItemLines
                  items={alsoIncluded}
                  onChange={setAlsoIncluded}
                  label="Also Included"
                  placeholder="e.g. Debris removal"
                />
                <WorkItemLines
                  items={exclusions}
                  onChange={setExclusions}
                  label="Not Included / Exclusions"
                  placeholder="e.g. Permits"
                />
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

            {/* GENERATE BUTTON */}
            <Button
              onClick={handleGenerate}
              
              className="w-full gap-2"
              size="lg"
            >
              <FileText className="h-4 w-4" />
              Generate Scope of Work PDF
            </Button>

            <div className="h-4" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

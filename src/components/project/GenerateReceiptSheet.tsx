import { useState, useEffect } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { generatePDF, generatePDFHtml } from '@/lib/pdfExport';
import { saveDocumentToProject } from '@/lib/saveDocumentToProject';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormulaInput } from '@/components/ui/formula-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/use-toast';
import { useProjectOptions } from '@/hooks/useProjectOptions';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';

interface GenerateReceiptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
}

interface LineItem {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">{children}</p>
      <Separator className="mt-1.5" />
    </div>
  );
}

const newLineItem = (): LineItem => ({
  id: Math.random().toString(36).substring(7),
  description: '',
  qty: '1',
  unitPrice: '',
});

export function GenerateReceiptSheet({ open, onOpenChange, projectName = '' }: GenerateReceiptSheetProps) {
  const { settings } = useCompanySettings();
  const { toast } = useToast();
  const projects = useProjectOptions();

  const [vendorName, setVendorName] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNumber, setReceiptNumber] = useState('RCP-001');
  const [projName, setProjName] = useState(projectName);
  const [descriptionOfWork, setDescriptionOfWork] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    setProjName(projectName);
  }, [projectName]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setReceiptNumber('RCP-001');
      setDescriptionOfWork('');
      setLineItems([newLineItem()]);
      setPaymentMethod('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSelectedProjectId('');
    }
    onOpenChange(val);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const total = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
  }, 0);

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const buildContent = () => {
    const lines: string[] = ['PAYMENT RECEIPT', ''];

    if (receiptNumber) lines.push(`Receipt Number: ${receiptNumber}`);
    if (receiptDate) lines.push(`Receipt Date: ${receiptDate}`);

    lines.push('', 'RECEIPT FROM (VENDOR / PAYEE)');
    lines.push(`Vendor: ${vendorName || '—'}`);


    if (projName) {
      lines.push('', 'FOR PROJECT');
      lines.push(`Project: ${projName}`);
    }

    if (descriptionOfWork) {
      lines.push('', 'DESCRIPTION OF WORK / SERVICES');
      lines.push(descriptionOfWork);
    }

    const validItems = lineItems.filter(item => item.description || parseFloat(item.unitPrice) > 0);
    if (validItems.length > 0) {
      lines.push('', 'LINE ITEMS');
      validItems.forEach(item => {
        const qty = parseFloat(item.qty) || 1;
        const price = parseFloat(item.unitPrice) || 0;
        const itemTotal = qty * price;
        if (item.description || price > 0) {
          lines.push(`  ${item.description || 'Item'}: ${qty} x ${fmt(price)} = ${fmt(itemTotal)}`);
        }
      });
    }

    lines.push('');
    lines.push(`TOTAL PAID: ${fmt(total)}`);

    if (paymentMethod || paymentDate || notes) {
      lines.push('', 'PAYMENT DETAILS');
      if (paymentMethod) lines.push(`Payment Method: ${paymentMethod}`);
      if (paymentDate) lines.push(`Payment Date: ${paymentDate}`);
      if (notes) lines.push(`Notes: ${notes}`);
    }

    return lines.join('\n');
  };

  const getPdfOptions = () => ({
    docType: 'Receipt' as const,
    companyName: settings?.company_name || '',
    logoUrl: settings?.logo_url,
    receiptData: {
      vendorName,
      receiptNumber,
      receiptDate,
      projectName: projName,
      descriptionOfWork,
      lineItems: lineItems
        .filter(item => item.description || parseFloat(item.unitPrice) > 0)
        .map(item => ({
          description: item.description || 'Item',
          qty: parseFloat(item.qty) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          total: (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0),
        })),
      paymentMethod,
      paymentDate,
      notes,
      total,
    },
  });

  const handleGeneratePDF = () => {
    generatePDF(buildContent(), getPdfOptions());
  };

  const handleSaveToProject = async () => {
    if (!selectedProjectId) return;
    setIsSaving(true);
    try {
      const html = generatePDFHtml(buildContent(), getPdfOptions());
      await saveDocumentToProject(html, selectedProjectId, 'Receipt', 'general');
      const proj = projects.find(p => p.id === selectedProjectId);
      toast({
        title: 'Document saved',
        description: `Receipt saved to ${proj?.name ?? 'project'} Documents`,
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Save failed', description: 'Could not save document to project.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
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
              <SheetTitle className="text-base">Receipt Generator</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Premium fintech-style payment receipt</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-7">

            {/* RECEIPT INFO */}
            <div>
              <SectionLabel>Receipt Info</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>
                    Vendor Name <span className="text-muted-foreground font-normal">(Payee — person or company being paid)</span>
                  </Label>
                  <Input value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. Reiber Molina" />
                </div>
                <div className="space-y-1.5">
                  <Label>Receipt Date</Label>
                  <Input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Receipt Number</Label>
                  <Input value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} placeholder="RCP-001" />
                </div>
              </div>
            </div>

            {/* JOB DETAILS */}
            <div>
              <SectionLabel>Job Details</SectionLabel>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Project Name</Label>
                  <Input value={projName} onChange={e => setProjName(e.target.value)} placeholder="Project name" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description of Work / Services</Label>
                  <Textarea
                    value={descriptionOfWork}
                    onChange={e => setDescriptionOfWork(e.target.value)}
                    placeholder="What services or work was provided..."
                    className="min-h-[72px] resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* LINE ITEMS */}
            <div>
              <SectionLabel>Line Items</SectionLabel>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_60px_90px_32px] gap-2 px-0.5">
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p className="text-xs font-medium text-muted-foreground">Qty</p>
                  <p className="text-xs font-medium text-muted-foreground">Unit Price</p>
                  <span />
                </div>

                {lineItems.map((item) => {
                  const rowTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
                  return (
                    <div key={item.id} className="grid grid-cols-[1fr_60px_90px_32px] gap-2 items-center">
                      <Input
                        value={item.description}
                        onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                        className="text-sm"
                      />
                      <FormulaInput
                        value={item.qty}
                        onChange={e => updateLineItem(item.id, 'qty', e.target.value)}
                        type="number"
                        min="0"
                        className="text-sm"
                        showHint={false}
                      />
                      <FormulaInput
                        value={item.unitPrice}
                        onChange={e => updateLineItem(item.id, 'unitPrice', e.target.value)}
                        type="number"
                        min="0"
                        placeholder="0.00"
                        className="text-sm"
                        showHint={false}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      {rowTotal > 0 && (
                        <p className="col-span-3 text-right text-xs text-muted-foreground pr-2">{fmt(rowTotal)}</p>
                      )}
                    </div>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLineItems(prev => [...prev, newLineItem()])}
                  className="gap-1.5 text-xs mt-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Line Item
                </Button>

                <div className="mt-3 rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-primary">Total Paid</p>
                      <p className="text-xs text-muted-foreground mt-0.5">All line items combined</p>
                    </div>
                    <span className="text-2xl font-black text-foreground tracking-tight tabular-nums">{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT */}
            <div>
              <SectionLabel>Payment</SectionLabel>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Wire Transfer">Wire Transfer</SelectItem>
                        <SelectItem value="Zelle">Zelle</SelectItem>
                        <SelectItem value="Venmo">Venmo</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Date</Label>
                    <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* SAVE TO PROJECT */}
            <div>
              <SectionLabel>Save to Project</SectionLabel>
              <div className="space-y-1.5">
                <ProjectAutocomplete
                  projects={projects}
                  value={selectedProjectId}
                  onSelect={(id) => setSelectedProjectId(id === selectedProjectId ? '' : id)}
                  placeholder="Select a project…"
                />
                <p className="text-xs text-muted-foreground">Optional — select a project to enable saving a copy to its Documents tab</p>
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <Button onClick={handleGeneratePDF} className="w-full gap-2" size="lg">
              <FileText className="h-4 w-4" />
              Generate Receipt PDF
            </Button>

            {selectedProjectId && (
              <Button onClick={handleSaveToProject} variant="outline" className="w-full gap-2" size="lg" disabled={isSaving}>
                <FileText className="h-4 w-4" />
                {isSaving ? 'Saving…' : 'Save to Project'}
              </Button>
            )}

            <div className="h-4" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

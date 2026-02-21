import { useState, useEffect } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { generatePDFHtml } from '@/lib/pdfExport';
import { generatePDF } from '@/lib/pdfExport';
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

interface GenerateInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName?: string;
  projectAddress?: string;
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

export function GenerateInvoiceSheet({ open, onOpenChange, projectName = '', projectAddress = '' }: GenerateInvoiceSheetProps) {
  const { settings } = useCompanySettings();
  const { toast } = useToast();
  const projects = useProjectOptions();

  const [companyName, setCompanyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [projName, setProjName] = useState(projectName);
  const [projAddress, setProjAddress] = useState(projectAddress);
  const [descriptionOfWork, setDescriptionOfWork] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [taxRate, setTaxRate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.company_name) setCompanyName(settings.company_name);
  }, [settings]);

  useEffect(() => {
    setProjName(projectName);
    setProjAddress(projectAddress);
  }, [projectName, projectAddress]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setClientName('');
      setInvoiceNumber('INV-001');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setDescriptionOfWork('');
      setLineItems([newLineItem()]);
      setTaxRate('');
      setPaymentMethod('');
      setPaymentNotes('');
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

  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
  }, 0);

  const taxAmount = taxRate ? subtotal * (parseFloat(taxRate) / 100) : 0;
  const total = subtotal + taxAmount;

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const handleGenerate = async () => {
    const lines: string[] = ['INVOICE', ''];

    if (invoiceNumber) lines.push(`Invoice Number: ${invoiceNumber}`);
    if (invoiceDate) lines.push(`Invoice Date: ${invoiceDate}`);
    if (dueDate) lines.push(`Due Date: ${dueDate}`);

    if (companyName) {
      lines.push('', 'FROM');
      lines.push(`Company: ${companyName}`);
    }

    if (clientName) {
      lines.push('', 'TO');
      lines.push(`Client: ${clientName}`);
    }

    if (projName || projAddress) {
      lines.push('', 'PROJECT');
      if (projName) lines.push(`Project: ${projName}`);
      if (projAddress) lines.push(`Address: ${projAddress}`);
    }

    if (descriptionOfWork) {
      lines.push('', 'DESCRIPTION OF WORK');
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
    if (taxRate && parseFloat(taxRate) > 0) {
      lines.push(`TAX (${taxRate}%): ${fmt(taxAmount)}`);
    }
    lines.push(`TOTAL: ${fmt(total)}`);

    if (paymentMethod || paymentNotes) {
      lines.push('', 'PAYMENT INFORMATION');
      if (paymentMethod) lines.push(`Payment Method: ${paymentMethod}`);
      if (paymentNotes) lines.push(`Notes: ${paymentNotes}`);
    }

    const content = lines.join('\n');
    const pdfOptions = {
      docType: 'Invoice' as const,
      companyName: settings?.company_name || companyName || 'Your Company',
      logoUrl: settings?.logo_url,
    };

    // Open PDF in new tab
    generatePDF(content, pdfOptions);

    // Save to project if selected
    if (selectedProjectId) {
      setIsSaving(true);
      try {
        const html = generatePDFHtml(content, pdfOptions);
        await saveDocumentToProject(html, selectedProjectId, 'Invoice', 'invoice');
        const proj = projects.find(p => p.id === selectedProjectId);
        toast({
          title: 'Document saved',
          description: `Invoice saved to ${proj?.name ?? 'project'} Documents`,
        });
      } catch (err) {
        console.error(err);
        toast({ title: 'Save failed', description: 'Could not save document to project.', variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
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
              <SheetTitle className="text-base">Invoice Generator</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Build a contractor invoice PDF</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-7">

            {/* INVOICE INFO */}
            <div>
              <SectionLabel>Invoice Info</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company" />
                </div>
                <div className="space-y-1.5">
                  <Label>Client / Property Name</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. John Smith" />
                </div>
                <div className="space-y-1.5">
                  <Label>Invoice Number</Label>
                  <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Invoice Date</Label>
                  <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* JOB DETAILS */}
            <div>
              <SectionLabel>Job Details</SectionLabel>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Project Name</Label>
                    <Input value={projName} onChange={e => setProjName(e.target.value)} placeholder="Project name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Project Address</Label>
                    <Input value={projAddress} onChange={e => setProjAddress(e.target.value)} placeholder="Address" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description of Work</Label>
                  <Textarea
                    value={descriptionOfWork}
                    onChange={e => setDescriptionOfWork(e.target.value)}
                    placeholder="Brief overview of the work performed..."
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
                      <Input
                        value={item.qty}
                        onChange={e => updateLineItem(item.id, 'qty', e.target.value)}
                        type="number"
                        min="0"
                        className="text-sm"
                      />
                      <Input
                        value={item.unitPrice}
                        onChange={e => updateLineItem(item.id, 'unitPrice', e.target.value)}
                        type="number"
                        min="0"
                        placeholder="0.00"
                        className="text-sm"
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

                <div className="mt-3 space-y-1.5 border-t pt-3">
                  <div className="flex items-center justify-between text-sm gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tax</span>
                      <Input
                        value={taxRate}
                        onChange={e => setTaxRate(e.target.value)}
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        className="h-7 w-16 text-xs"
                      />
                      <span className="text-muted-foreground text-xs">%</span>
                    </div>
                    <span className="font-medium">{fmt(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-1.5">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT INFO */}
            <div>
              <SectionLabel>Payment Info</SectionLabel>
              <div className="space-y-3">
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
                  <Label>Payment Instructions / Notes</Label>
                  <Textarea
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="e.g. Make check payable to ABC Construction..."
                    className="min-h-[72px] resize-none text-sm"
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
                <p className="text-xs text-muted-foreground">Optional — saves a copy to the project's Documents tab</p>
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <Button onClick={handleGenerate} className="w-full gap-2" size="lg" disabled={isSaving}>
              <FileText className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Generate Invoice PDF'}
            </Button>

            <div className="h-4" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

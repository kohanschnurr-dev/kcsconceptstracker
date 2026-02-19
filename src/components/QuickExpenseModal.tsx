import { useState, useRef, useEffect } from 'react';
import { Camera, DollarSign, X, Upload, Loader2, FileText, Sparkles, Package, Wrench, Download, FileSpreadsheet, Copy, Check, CheckCircle2, AlertTriangle, Sun, Maximize, Eye, Layers } from 'lucide-react';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllCategories, getBudgetCategories, TEXAS_SALES_TAX, Project, PaymentMethod, BudgetCategory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { ParsedRow, processCSVText, downloadSampleCSV, AI_IMPORT_PROMPT } from '@/lib/csvImportUtils';
import { toast as sonnerToast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type BudgetCategoryEnum = Database['public']['Enums']['budget_category'];

interface QuickExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onExpenseCreated?: () => void;
}

// ─── Single Expense Form (unchanged) ───────────────────────────────
function ExpenseForm({ 
  projects, 
  onExpenseCreated, 
  onClose 
}: { 
  projects: Project[]; 
  onExpenseCreated?: () => void;
  onClose: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [includeTax, setIncludeTax] = useState(false);
  const [expenseType, setExpenseType] = useState<'product' | 'labor'>('product');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showTextInput, setShowTextInput] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showReceiptTips, setShowReceiptTips] = useState(false);
  const [isParsingImage, setIsParsingImage] = useState(false);
  const [dontRemindChecked, setDontRemindChecked] = useState(false);

  const calculateTax = () => {
    const baseAmount = parseFloat(amount) || 0;
    return baseAmount * TEXAS_SALES_TAX;
  };

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    return includeTax ? baseAmount + calculateTax() : baseAmount;
  };

  const handleParseReceiptText = async () => {
    if (!receiptText.trim()) {
      toast({ title: 'No text provided', description: 'Please paste receipt text to parse.', variant: 'destructive' });
      return;
    }
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-receipt-text', { body: { receiptText: receiptText.trim() } });
      if (error) throw error;
      if (data?.data) {
        const parsed = data.data;
        if (parsed.vendor) setVendor(parsed.vendor);
        if (parsed.date) setDate(parsed.date);
        if (parsed.amount) setAmount(parsed.amount.toString());
        if (parsed.description) setDescription(parsed.description);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod as PaymentMethod);
        if (parsed.includesTax !== undefined) setIncludeTax(parsed.includesTax);
        toast({ title: 'Receipt parsed', description: 'Expense details extracted successfully.' });
        setShowTextInput(false);
        setReceiptText('');
      }
    } catch (error: any) {
      console.error('Error parsing receipt:', error);
      toast({ title: 'Parse failed', description: error.message || 'Could not parse receipt text.', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleReceiptPhotoClick = () => {
    const dismissed = localStorage.getItem('kcs-receipt-tips-dismissed') === 'true';
    if (dismissed) {
      fileInputRef.current?.click();
    } else {
      setShowReceiptTips(true);
    }
  };

  const handleTipsGotIt = () => {
    if (dontRemindChecked) {
      localStorage.setItem('kcs-receipt-tips-dismissed', 'true');
    }
    setShowReceiptTips(false);
    setDontRemindChecked(false);
    setTimeout(() => fileInputRef.current?.click(), 200);
  };

  const handleParseReceiptImage = async () => {
    if (!receiptFile || !receiptPreview) return;
    setIsParsingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-receipt-image', {
        body: { image_base64: receiptPreview },
      });
      if (error) throw error;
      if (data?.data) {
        const parsed = data.data;
        if (parsed.vendor_name) setVendor(parsed.vendor_name);
        if (parsed.purchase_date) setDate(parsed.purchase_date);
        if (parsed.total_amount) setAmount(parsed.total_amount.toString());
        if (parsed.tax_amount && parsed.tax_amount > 0) setIncludeTax(false); // tax already included in total
        if (parsed.line_items?.length > 0) {
          const desc = parsed.line_items.map((li: any) => li.item_name).join(', ');
          setDescription(desc.substring(0, 200));
        }
        toast({ title: 'Receipt scanned', description: `Extracted ${parsed.line_items?.length || 0} items from ${parsed.vendor_name || 'receipt'}.` });
      }
    } catch (error: any) {
      console.error('Error parsing receipt image:', error);
      toast({ title: 'Scan failed', description: error.message || 'Could not parse receipt image.', variant: 'destructive' });
    } finally {
      setIsParsingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (e) => { setReceiptPreview(e.target?.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;
    setIsUploading(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('project-photos').upload(filePath, receiptFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('project-photos').getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({ title: 'Upload failed', description: 'Could not upload receipt image.', variant: 'destructive' });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !selectedCategory || !amount || !vendor) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: existingCategory, error: fetchError } = await supabase
        .from('project_categories').select('id').eq('project_id', selectedProject).eq('category', selectedCategory as BudgetCategory).maybeSingle();
      if (fetchError) throw fetchError;
      let categoryId = existingCategory?.id;
      if (!categoryId) {
        const { data: newCategory, error: createError } = await supabase
          .from('project_categories').insert({ project_id: selectedProject, category: selectedCategory as BudgetCategory, estimated_budget: 0 }).select('id').single();
        if (createError) throw createError;
        categoryId = newCategory.id;
      }
      const receiptUrl = await uploadReceipt();
      const { error } = await supabase.from('expenses').insert({
        project_id: selectedProject, category_id: categoryId, amount: calculateTotal(), vendor_name: vendor,
        description: description || null, payment_method: paymentMethod, status: 'actual',
        includes_tax: includeTax, tax_amount: includeTax ? calculateTax() : null, date, receipt_url: receiptUrl, expense_type: expenseType,
      });
      if (error) throw error;
      toast({ title: 'Expense logged', description: `$${calculateTotal().toFixed(2)} added successfully` });
      onClose();
      onExpenseCreated?.();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast({ title: 'Error', description: error.message || 'Failed to log expense.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {/* Text-to-Info Feature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Quick Import</Label>
          <Button type="button" variant={showTextInput ? "secondary" : "outline"} size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setShowTextInput(!showTextInput)}>
            <FileText className="h-3 w-3" />
            Paste Receipt Text
          </Button>
        </div>
        {showTextInput && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Textarea placeholder="Paste receipt text here (from email, screenshot OCR, etc.)..." value={receiptText} onChange={(e) => setReceiptText(e.target.value)} rows={6} className="text-xs font-mono" />
            <div className="flex gap-2">
              <Button type="button" size="sm" className="gap-1.5 flex-1" onClick={handleParseReceiptText} disabled={isParsing || !receiptText.trim()}>
                {isParsing ? (<><Loader2 className="h-3 w-3 animate-spin" />Parsing...</>) : (<><Sparkles className="h-3 w-3" />Extract Details</>)}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowTextInput(false); setReceiptText(''); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project</Label>
          <ProjectAutocomplete projects={projects} value={selectedProject} onSelect={setSelectedProject} placeholder="Search projects..." filterActive={true} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {getBudgetCategories().map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Type:</Label>
        <ToggleGroup type="single" value={expenseType} onValueChange={(value) => value && setExpenseType(value as 'product' | 'labor')} className="justify-start">
          <ToggleGroupItem value="product" size="sm" className="gap-1"><Package className="h-3 w-3" />Product</ToggleGroupItem>
          <ToggleGroupItem value="labor" size="sm" className="gap-1"><Wrench className="h-3 w-3" />Labor</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-9 font-mono text-lg" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vendor</Label>
          <Input placeholder="" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Payment</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="financed">Financed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea placeholder="What was purchased?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Switch id="tax" checked={includeTax} onCheckedChange={setIncludeTax} />
          <Label htmlFor="tax" className="text-sm cursor-pointer">Add TX Sales Tax (8.25%)</Label>
        </div>
        {includeTax && amount && (
          <span className="text-sm font-mono text-muted-foreground">+${calculateTax().toFixed(2)}</span>
        )}
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label>Receipt (optional)</Label>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        {receiptPreview ? (
          <div className="space-y-2">
            <div className="relative">
              <img src={receiptPreview} alt="Receipt preview" className="w-full h-32 object-cover rounded-lg border border-border" />
              <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button type="button" variant="secondary" size="sm" className="w-full gap-1.5" onClick={handleParseReceiptImage} disabled={isParsingImage}>
              {isParsingImage ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanning...</>) : (<><Sparkles className="h-3.5 w-3.5" />Scan Receipt</>)}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full gap-2" onClick={handleReceiptPhotoClick}>
            <Camera className="h-4 w-4" />Add Receipt Photo
          </Button>
        )}
      </div>

      {/* Receipt Tips Dialog */}
      <Dialog open={showReceiptTips} onOpenChange={setShowReceiptTips}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Tips for a Great Receipt Photo
            </DialogTitle>
            <DialogDescription>Follow these tips for the best AI scan results.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
              <Layers className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-sm font-medium">Lay it flat</p><p className="text-xs text-muted-foreground">Place the receipt on a solid, flat surface</p></div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
              <Maximize className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-sm font-medium">Capture the full receipt</p><p className="text-xs text-muted-foreground">Ensure all edges and text are visible in frame</p></div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
              <Sun className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-sm font-medium">Good lighting</p><p className="text-xs text-muted-foreground">Avoid shadows, glare, and low-light conditions</p></div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
              <Eye className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-sm font-medium">Text must be readable</p><p className="text-xs text-muted-foreground">Make sure all numbers and text are sharp and clear</p></div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <Checkbox id="dont-remind" checked={dontRemindChecked} onCheckedChange={(c) => setDontRemindChecked(c === true)} />
              <label htmlFor="dont-remind" className="text-sm text-muted-foreground cursor-pointer">Don't show this again</label>
            </div>
            <Button onClick={handleTipsGotIt}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {amount && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">Total</span>
          <span className="text-xl font-mono font-semibold text-primary">${calculateTotal().toFixed(2)}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
        {isSubmitting || isUploading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isUploading ? 'Uploading...' : 'Saving...'}</>) : ('Log Expense')}
      </Button>
    </form>
  );
}

// ─── Import Tab ────────────────────────────────────────────────────
function ImportTab({
  projects,
  onExpenseCreated,
  onClose,
}: {
  projects: Project[];
  onExpenseCreated?: () => void;
  onClose: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState('');
  const [existingCategories, setExistingCategories] = useState<{ id: string; category: string }[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const allCategories = getBudgetCategories();

  // Fetch categories when project changes
  useEffect(() => {
    if (!selectedProject) { setExistingCategories([]); return; }
    supabase
      .from('project_categories')
      .select('id, category')
      .eq('project_id', selectedProject)
      .then(({ data }) => { setExistingCategories(data || []); });
  }, [selectedProject]);

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(AI_IMPORT_PROMPT);
    setCopied(true);
    sonnerToast.success('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => processCSV(ev.target?.result as string);
      reader.readAsText(file);
    } else { sonnerToast.error('Please drop a CSV file'); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processCSV(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = '';
  };

  const processCSV = (text: string) => {
    const result = processCSVText(text, allCategories);
    if (result.error) { sonnerToast.error(result.error); return; }
    setRows(result.rows);
    setStep('preview');
  };

  const updateRowCategory = (idx: number, catValue: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, matchedCategory: catValue, suggestedCategory: null } : r));
  };

  const readyRows = rows.filter(r => !r.hasError && r.matchedCategory);
  const needsAttention = rows.filter(r => r.hasError || !r.matchedCategory);
  const canImport = rows.length > 0 && needsAttention.length === 0;

  const handleImport = async () => {
    if (!canImport || !selectedProject) return;
    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { sonnerToast.error('Not authenticated'); setImporting(false); return; }

      const existingCatValues = new Set(existingCategories.map(c => c.category));
      const neededCats = [...new Set(rows.map(r => r.matchedCategory!))].filter(c => !existingCatValues.has(c));

      let newCatMap: Record<string, string> = {};
      if (neededCats.length > 0) {
        for (const cat of neededCats) { await supabase.rpc('add_budget_category', { new_value: cat }); }
        const { data: newCats, error: catError } = await supabase
          .from('project_categories')
          .insert(neededCats.map(cat => ({ project_id: selectedProject, category: cat as BudgetCategoryEnum, estimated_budget: 0 })))
          .select();
        if (catError) throw catError;
        newCats?.forEach(c => { newCatMap[c.category] = c.id; });
      }

      const catLookup: Record<string, string> = {};
      existingCategories.forEach(c => { catLookup[c.category] = c.id; });
      Object.assign(catLookup, newCatMap);

      const expenseRows = rows.map(r => ({
        project_id: selectedProject, category_id: catLookup[r.matchedCategory!],
        amount: r.amount, date: r.date, vendor_name: r.vendor || null,
        description: r.description || null, payment_method: r.paymentMethod as any,
        status: 'actual' as any, expense_type: r.expenseType, notes: r.notes || null, cost_type: 'construction',
      }));

      const { error: insertError } = await supabase.from('expenses').insert(expenseRows);
      if (insertError) throw insertError;

      sonnerToast.success(`${rows.length} expenses imported successfully`);
      onExpenseCreated?.();
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      sonnerToast.error('Import failed: ' + (err.message || 'Unknown error'));
    } finally { setImporting(false); }
  };

  const getCatLabel = (value: string) => allCategories.find(c => c.value === value)?.label || value;

  return (
    <div className="p-4 space-y-4" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Project Selector */}
      <div className="space-y-2">
        <Label>Project <span className="text-destructive">*</span></Label>
        <ProjectAutocomplete projects={projects} value={selectedProject} onSelect={setSelectedProject} placeholder="Select project for import..." filterActive={true} />
      </div>

      {!selectedProject && (
        <div className="text-center py-8 space-y-3">
          <p className="text-muted-foreground text-sm">
            Select a project above to begin importing expenses.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Best for adding numerous expenses at once
          </div>
        </div>
      )}

      {selectedProject && step === 'upload' && (
        <div className={`space-y-4 rounded-lg transition-all ${isDragging ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={(e) => { e.stopPropagation(); downloadSampleCSV(allCategories); sonnerToast.success('Sample CSV downloaded'); }}
              className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer">
              <Download className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="font-medium">Download Sample CSV</p>
                <p className="text-sm text-muted-foreground">Template with format guide</p>
              </div>
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer">
              <Upload className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="font-medium">Upload CSV File</p>
                <p className="text-sm text-muted-foreground">Drag & drop or click to select</p>
              </div>
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />

          {/* AI Prompt Helper */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Have messy data? Let AI format it</p>
                <p className="text-xs text-muted-foreground">Copy this prompt into ChatGPT, Gemini, or Claude, upload your file, save as .csv and import above.</p>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCopyPrompt(); }} className="shrink-0 gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </Button>
            </div>
            <pre className="text-xs text-muted-foreground bg-background rounded-md p-3 max-h-32 overflow-y-auto whitespace-pre-wrap border border-border">{AI_IMPORT_PROMPT}</pre>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-2">Required columns: Date, Category, Amount</p>
            <p>Optional: Vendor, Description, Payment Method, Expense Type, Notes</p>
          </div>
        </div>
      )}

      {selectedProject && step === 'preview' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-success border-success">
              <CheckCircle2 className="h-3 w-3" />{readyRows.length} ready
            </Badge>
            {needsAttention.length > 0 && (
              <Badge variant="outline" className="gap-1 text-warning border-warning">
                <AlertTriangle className="h-3 w-3" />{needsAttention.length} need attention
              </Badge>
            )}
            <Badge variant="secondary">
              Total: ${rows.reduce((s, r) => s + r.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Badge>
          </div>

          <div className="border rounded-lg overflow-auto max-h-[40vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={idx} className={row.hasError ? 'bg-destructive/5' : !row.matchedCategory ? 'bg-warning/5' : ''}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    <TableCell className="text-sm">{row.date}</TableCell>
                    <TableCell className="text-sm">{row.vendor || '—'}</TableCell>
                    <TableCell>
                      {row.matchedCategory ? (
                        <span className="text-sm">{getCatLabel(row.matchedCategory)}</span>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-sm text-warning">"{row.category}"</span>
                          <Select value={row.suggestedCategory || ''} onValueChange={(v) => updateRowCategory(idx, v)}>
                            <SelectTrigger className="h-7 text-xs w-[180px]"><SelectValue placeholder="Assign category..." /></SelectTrigger>
                            <SelectContent>
                              {allCategories.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{row.expenseType}</Badge></TableCell>
                    <TableCell>
                      {row.hasError ? (<Badge variant="destructive" className="text-xs">{row.errorMsg}</Badge>)
                        : row.matchedCategory ? (<CheckCircle2 className="h-4 w-4 text-success" />)
                        : (<AlertTriangle className="h-4 w-4 text-warning" />)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setStep('upload'); setRows([]); }}>Back</Button>
            <Button onClick={handleImport} disabled={!canImport || importing}>
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {readyRows.length} Expenses
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal Shell ───────────────────────────────────────────────────
function ModalContent({ projects, onExpenseCreated, onClose }: { projects: Project[]; onExpenseCreated?: () => void; onClose: () => void }) {
  return (
    <Tabs defaultValue="single" className="w-full">
      <div className="px-4 pt-2">
        <TabsList className="w-full">
          <TabsTrigger value="single" className="flex-1 gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Single Expense
          </TabsTrigger>
          <TabsTrigger value="import" className="flex-1 gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Import CSV
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="single">
        <ExpenseForm projects={projects} onExpenseCreated={onExpenseCreated} onClose={onClose} />
      </TabsContent>
      <TabsContent value="import">
        <ImportTab projects={projects} onExpenseCreated={onExpenseCreated} onClose={onClose} />
      </TabsContent>
    </Tabs>
  );
}

export function QuickExpenseModal({ open, onOpenChange, projects, onExpenseCreated }: QuickExpenseModalProps) {
  const isMobile = useIsMobile();
  const handleClose = () => onOpenChange(false);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Add Expense
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <ModalContent projects={projects} onExpenseCreated={onExpenseCreated} onClose={handleClose} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto" onDragOver={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Add Expense
          </DialogTitle>
        </DialogHeader>
        <ModalContent projects={projects} onExpenseCreated={onExpenseCreated} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}

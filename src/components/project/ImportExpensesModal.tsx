import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, Copy, Check, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getBudgetCategories } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { ParsedRow, processCSVText, downloadSampleCSV, AI_IMPORT_PROMPT } from '@/lib/csvImportUtils';

type BudgetCategoryEnum = Database['public']['Enums']['budget_category'];

interface ImportExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingCategories: { id: string; category: string }[];
  onImportComplete: () => void;
  onLoanExpenseCreated?: (info: { expenseId: string; amount: number; date: string; projectId: string; vendorName?: string; description?: string }) => void;
}

export function ImportExpensesModal({ open, onOpenChange, projectId, existingCategories, onImportComplete, onLoanExpenseCreated }: ImportExpensesModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<'all' | 'attention'>('all');
  const fileRef = useRef<HTMLInputElement>(null);
  const allCategories = getBudgetCategories();

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(AI_IMPORT_PROMPT);
    setCopied(true);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetState = () => {
    setStep('upload');
    setRows([]);
    setImporting(false);
    setIsDragging(false);
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
    } else { toast.error('Please drop a CSV file'); }
  };

  const handleClose = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
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
    if (result.error) { toast.error(result.error); return; }
    setRows(result.rows);
    setStep('preview');
  };

  const updateRowCategory = (idx: number, catValue: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, matchedCategory: catValue, suggestedCategory: null } : r));
  };

  const updateRowCostType = (idx: number, costType: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, costType } : r));
  };

  const removeRow = (idx: number) => {
    setRows(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0) { setStep('upload'); }
      return next;
    });
  };

  const updateRowField = (idx: number, field: 'date' | 'amount', value: string) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const updated = { ...r };
      if (field === 'date') {
        updated.date = value;
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          updated.hasError = false;
          updated.errorMsg = undefined;
        }
      }
      if (field === 'amount') {
        const num = parseFloat(value.replace(/[^0-9.\-]/g, ''));
        if (!isNaN(num)) {
          updated.amount = num;
          updated.hasError = false;
          updated.errorMsg = undefined;
        }
      }
      return updated;
    }));
  };

  const readyRows = rows.filter(r => !r.hasError && r.matchedCategory);
  const needsAttention = rows.filter(r => r.hasError || !r.matchedCategory);
  const canImport = rows.length > 0 && needsAttention.length === 0;

  const handleImport = async () => {
    if (!canImport) return;
    setImporting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Not authenticated'); setImporting(false); return; }

      const existingCatValues = new Set(existingCategories.map(c => c.category));
      const neededCats = [...new Set(rows.map(r => r.matchedCategory!))].filter(c => !existingCatValues.has(c));

      let newCatMap: Record<string, string> = {};
      if (neededCats.length > 0) {
        for (const cat of neededCats) { await supabase.rpc('add_budget_category', { new_value: cat }); }
        const { data: newCats, error: catError } = await supabase
          .from('project_categories')
          .insert(neededCats.map(cat => ({ project_id: projectId, category: cat as BudgetCategoryEnum, estimated_budget: 0 })))
          .select();
        if (catError) throw catError;
        newCats?.forEach(c => { newCatMap[c.category] = c.id; });
      }

      const catLookup: Record<string, string> = {};
      existingCategories.forEach(c => { catLookup[c.category] = c.id; });
      Object.assign(catLookup, newCatMap);

      const expenseRows = rows.map(r => ({
        project_id: projectId, category_id: catLookup[r.matchedCategory!],
        amount: r.amount, date: r.date, vendor_name: r.vendor || null,
        description: r.description || null, payment_method: r.paymentMethod as any,
        status: 'actual' as any, expense_type: r.expenseType, notes: r.notes || null,
        cost_type: r.costType || 'construction',
      }));

      const { data: insertedData, error: insertError } = await supabase.from('expenses').insert(expenseRows).select('id, amount, date, vendor_name, description, cost_type');
      if (insertError) throw insertError;

      toast.success(`${rows.length} expenses imported successfully`);
      onImportComplete();

      // Trigger loan payment assignment for imported loan expenses
      if (onLoanExpenseCreated && insertedData) {
        const loanExpenses = insertedData.filter((e: any) => e.cost_type === 'loan');
        if (loanExpenses.length > 0) {
          // Process the first loan expense (user can handle others via cost type change)
          const first = loanExpenses[0];
          onLoanExpenseCreated({
            expenseId: first.id,
            amount: Number(first.amount),
            date: first.date,
            projectId,
            vendorName: first.vendor_name || undefined,
            description: first.description || undefined,
          });
        }
      }

      handleClose(false);
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error('Import failed: ' + (err.message || 'Unknown error'));
    } finally { setImporting(false); }
  };

  const getCatLabel = (value: string) => allCategories.find(c => c.value === value)?.label || value;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onDragOver={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Expenses from CSV
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' 
              ? 'Upload a CSV file to bulk-import expenses into this project.' 
              : `${readyRows.length} rows ready${needsAttention.length > 0 ? `, ${needsAttention.length} need attention` : ''}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div
            className={`space-y-6 py-4 rounded-lg transition-all ${isDragging ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); downloadSampleCSV(allCategories); toast.success('Sample CSV downloaded'); }}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
              >
                <Download className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Download Sample CSV</p>
                  <p className="text-sm text-muted-foreground">Template with format guide & valid categories</p>
                </div>
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed transition-all cursor-pointer border-border hover:border-primary/50 hover:bg-accent/50"
              >
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
                  <p className="font-medium text-sm">Have messy data? Let AI format it for you</p>
                  <p className="text-xs text-muted-foreground">Copy this prompt into ChatGPT, Gemini, Claude, or other LLM, then upload your file (PDF, Excel, or receipt image). Save the output as a .csv file and upload it above.</p>
                </div>
                <Button
                  variant="outline" size="sm"
                  onClick={(e) => { e.stopPropagation(); handleCopyPrompt(); }}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy Prompt'}
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground bg-background rounded-md p-3 max-h-32 overflow-y-auto whitespace-pre-wrap border border-border">{AI_IMPORT_PROMPT}</pre>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-2">Required columns: Date, Category, Amount</p>
              <p>Optional: Vendor, Description, Payment Method (cash/check/card/transfer), Expense Type (product/labor), Notes</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={`gap-1 text-success border-success cursor-pointer ${filter === 'all' ? 'ring-2 ring-success/30' : ''}`} onClick={() => setFilter('all')}>
                <CheckCircle2 className="h-3 w-3" />{readyRows.length} ready
              </Badge>
              {needsAttention.length > 0 && (
                <Badge variant="outline" className={`gap-1 text-warning border-warning cursor-pointer ${filter === 'attention' ? 'ring-2 ring-warning/30' : ''}`} onClick={() => setFilter('attention')}>
                  <AlertTriangle className="h-3 w-3" />{needsAttention.length} need attention
                </Badge>
              )}
              <Badge variant="secondary">
                Total: ${rows.reduce((s, r) => s + r.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Badge>
            </div>

            <div className="border rounded-lg overflow-auto max-h-[50vh]">
              <Table>
                <TableHeader>
                 <TableRow>
                     <TableHead className="w-8">#</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Contractor</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead className="text-right">Amount</TableHead>
                     <TableHead>Expense Type</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="w-10"></TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                {(filter === 'attention'
                  ? rows.map((r, i) => ({ ...r, originalIdx: i })).filter(r => r.hasError || !r.matchedCategory)
                  : rows.map((r, i) => ({ ...r, originalIdx: i }))
                ).map((row) => (
                    <TableRow key={row.originalIdx} className={row.hasError ? 'bg-destructive/5' : !row.matchedCategory ? 'bg-warning/5' : ''}>
                      <TableCell className="text-muted-foreground text-xs">{row.originalIdx + 1}</TableCell>
                      <TableCell className="text-sm">
                        {row.hasError && isNaN(new Date(row.date).getTime()) ? (
                          <Input className="h-7 text-xs w-[120px]" defaultValue={row.date} onChange={(e) => updateRowField(row.originalIdx, 'date', e.target.value)} />
                        ) : row.date}
                      </TableCell>
                      <TableCell className="text-sm">{row.vendor || '—'}</TableCell>
                      <TableCell>
                        {row.matchedCategory ? (
                          <span className="text-sm">{getCatLabel(row.matchedCategory)}</span>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-sm text-warning">"{row.category}"</span>
                            <Select value={row.suggestedCategory || ''} onValueChange={(v) => updateRowCategory(row.originalIdx, v)}>
                              <SelectTrigger className="h-7 text-xs w-[180px]"><SelectValue placeholder="Assign category..." /></SelectTrigger>
                              <SelectContent>
                                {allCategories.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={row.costType || 'construction'}
                          onValueChange={(v) => updateRowCostType(row.originalIdx, v)}
                        >
                          <SelectTrigger className="h-7 text-xs w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="loan">Loan</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="transaction">Transaction</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${row.amount < 0 ? 'text-success' : ''}`}>
                        {row.hasError && isNaN(row.amount) ? (
                          <Input className="h-7 text-xs w-[100px] ml-auto text-right" defaultValue={String(row.amount || '')} onChange={(e) => updateRowField(row.originalIdx, 'amount', e.target.value)} />
                        ) : (
                          <>{row.amount < 0 ? '-' : ''}${Math.abs(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{row.expenseType}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.hasError ? (<AlertTriangle className="h-4 w-4 text-destructive" />)
                          : row.matchedCategory ? (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              {row.amount < 0 && <Badge variant="outline" className="text-xs text-success border-success">Refund</Badge>}
                            </div>
                          )
                          : (<AlertTriangle className="h-4 w-4 text-warning" />)}
                      </TableCell>
                      <TableCell>
                        {(row.hasError || !row.matchedCategory) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.originalIdx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <Button variant="outline" onClick={() => { setStep('upload'); setRows([]); }} className="mr-auto">Back</Button>
          )}
          <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
          {step === 'preview' && (
            <Button onClick={handleImport} disabled={!canImport || importing}>
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {readyRows.length} Expenses
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, CheckCircle2, AlertTriangle, Loader2, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { getBudgetCategories } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type BudgetCategoryEnum = Database['public']['Enums']['budget_category'];

interface ImportExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingCategories: { id: string; category: string }[];
  onImportComplete: () => void;
}

interface ParsedRow {
  date: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  expenseType: string;
  notes: string;
  matchedCategory: string | null;
  suggestedCategory: string | null;
  hasError: boolean;
  errorMsg?: string;
}

// Simple CSV parser that handles quoted fields
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim());
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        current = '';
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

// Normalize for comparison
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Simple similarity score (longest common subsequence ratio)
function similarity(a: string, b: string): number {
  const an = normalize(a);
  const bn = normalize(b);
  if (!an || !bn) return 0;
  const len = Math.max(an.length, bn.length);
  let matches = 0;
  let bi = 0;
  for (let ai = 0; ai < an.length && bi < bn.length; ai++) {
    if (an[ai] === bn[bi]) { matches++; bi++; }
    else {
      // try skipping in b
      const nextInB = bn.indexOf(an[ai], bi);
      if (nextInB !== -1 && nextInB - bi < 3) { matches++; bi = nextInB + 1; }
    }
  }
  return matches / len;
}

function matchCategory(input: string, categories: { value: string; label: string }[]): { exact: string | null; suggested: string | null } {
  const norm = normalize(input);
  // Exact match on label
  const exact = categories.find(c => normalize(c.label) === norm);
  if (exact) return { exact: exact.value, suggested: null };
  // Exact match on value
  const exactVal = categories.find(c => normalize(c.value) === norm);
  if (exactVal) return { exact: exactVal.value, suggested: null };
  // Fuzzy
  let bestScore = 0;
  let bestCat: string | null = null;
  for (const c of categories) {
    const s = Math.max(similarity(input, c.label), similarity(input, c.value));
    if (s > bestScore) { bestScore = s; bestCat = c.value; }
  }
  return { exact: null, suggested: bestScore > 0.4 ? bestCat : categories[0]?.value || null };
}

function parseDate(input: string): string | null {
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  // Try MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const [m, d, y] = input.split('/').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return null;
}

export function ImportExpensesModal({ open, onOpenChange, projectId, existingCategories, onImportComplete }: ImportExpensesModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const allCategories = getBudgetCategories();

  const categoryList = allCategories.map(c => c.label).join(', ');
  const aiPrompt = `Convert my raw expense data into a CSV with these exact columns:
Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes

Strict Formatting Rules:
- Date: Convert all dates to MM/DD/YYYY.
- Category: Use one of these exact values: ${categoryList}
- Expense Type: 'product' for materials (Home Depot, Lowe's, etc.) or 'labor' for service providers (contractors, plumbers, etc.).
- Amount: Numerical value only (no $ signs or commas).
- Payment Method: cash, check, card, or transfer. Leave blank if unclear.
- Notes: Include relevant details like 'Licensed & insured' or project locations.
- Missing Data: Leave fields blank if not available.

Output: Provide the CSV content only, no headers or explanation. Ready to copy-paste into a .csv file.

Here is my raw data:`;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(aiPrompt);
    setCopied(true);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const resetState = () => {
    setStep('upload');
    setRows([]);
    setImporting(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const downloadSample = () => {
    const catList = allCategories.map(c => c.label).join(', ');
    const header = 'Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes';
    const example1 = '2025-01-15,Home Depot,Flooring,LVP for living room,2450.00,card,product,';
    const example2 = '2025-01-18,Mike\'s Plumbing,Plumbing,Rough-in for 2 bathrooms,3200.00,check,labor,Licensed & insured';
    const example3 = '2025-02-01,Lowe\'s,Electrical,Panels and wiring,1875.50,card,product,';
    const content = [
      '# SAMPLE CSV - Delete these instruction lines before importing',
      `# Valid Categories: ${catList}`,
      '#',
      '# Date: YYYY-MM-DD or MM/DD/YYYY',
      '# Payment Method: cash, check, card, transfer (optional, defaults to card)',
      '# Expense Type: product or labor (optional, defaults to product)',
      '#',
      header,
      example1,
      example2,
      example3,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      processCSV(text);
    };
    reader.readAsText(file);
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const processCSV = (text: string) => {
    // Strip comment lines
    const cleaned = text.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
    const parsed = parseCSV(cleaned);
    if (parsed.length < 2) {
      toast.error('CSV must have a header row and at least one data row');
      return;
    }

    // Detect header
    const header = parsed[0].map(h => h.toLowerCase().trim());
    const colMap = {
      date: header.indexOf('date'),
      vendor: header.indexOf('vendor'),
      category: header.indexOf('category'),
      description: header.indexOf('description'),
      amount: header.indexOf('amount'),
      paymentMethod: Math.max(header.indexOf('payment method'), header.indexOf('paymentmethod'), header.indexOf('payment_method')),
      expenseType: Math.max(header.indexOf('expense type'), header.indexOf('expensetype'), header.indexOf('expense_type'), header.indexOf('type')),
      notes: header.indexOf('notes'),
    };

    if (colMap.date === -1 || colMap.amount === -1 || colMap.category === -1) {
      toast.error('CSV must have at least Date, Category, and Amount columns');
      return;
    }

    const dataRows = parsed.slice(1);
    const result: ParsedRow[] = dataRows.map(cols => {
      const get = (idx: number) => (idx >= 0 && idx < cols.length ? cols[idx] : '');
      const rawDate = get(colMap.date);
      const parsedDate = parseDate(rawDate);
      const rawAmount = get(colMap.amount).replace(/[$,]/g, '');
      const amount = parseFloat(rawAmount);
      const rawCategory = get(colMap.category);
      const { exact, suggested } = matchCategory(rawCategory, allCategories);
      const pm = get(colMap.paymentMethod).toLowerCase();
      const validPm = ['cash', 'check', 'card', 'transfer'].includes(pm) ? pm : 'card';
      const rawExpenseType = get(colMap.expenseType).toLowerCase();
      const expenseType = rawExpenseType === 'labor' ? 'labor' : 'product';

      let hasError = false;
      let errorMsg: string | undefined;
      if (!parsedDate) { hasError = true; errorMsg = 'Invalid date'; }
      if (isNaN(amount) || amount <= 0) { hasError = true; errorMsg = 'Invalid amount'; }

      return {
        date: parsedDate || rawDate,
        vendor: get(colMap.vendor),
        category: rawCategory,
        description: get(colMap.description),
        amount: isNaN(amount) ? 0 : amount,
        paymentMethod: validPm,
        expenseType,
        notes: get(colMap.notes),
        matchedCategory: exact,
        suggestedCategory: exact ? null : suggested,
        hasError,
        errorMsg,
      };
    });

    setRows(result);
    setStep('preview');
  };

  const updateRowCategory = (idx: number, catValue: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, matchedCategory: catValue, suggestedCategory: null } : r));
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

      // Find categories that need to be created (matched but not in existingCategories)
      const existingCatValues = new Set(existingCategories.map(c => c.category));
      const neededCats = [...new Set(rows.map(r => r.matchedCategory!))].filter(c => !existingCatValues.has(c));

      // Create missing project_categories
      let newCatMap: Record<string, string> = {};
      if (neededCats.length > 0) {
        const { data: newCats, error: catError } = await supabase
          .from('project_categories')
          .insert(neededCats.map(cat => ({
            project_id: projectId,
            category: cat as BudgetCategoryEnum,
            estimated_budget: 0,
          })))
          .select();
        if (catError) throw catError;
        newCats?.forEach(c => { newCatMap[c.category] = c.id; });
      }

      // Build category lookup: value -> id
      const catLookup: Record<string, string> = {};
      existingCategories.forEach(c => { catLookup[c.category] = c.id; });
      Object.assign(catLookup, newCatMap);

      // Batch insert expenses
      const expenseRows = rows.map(r => ({
        project_id: projectId,
        category_id: catLookup[r.matchedCategory!],
        amount: r.amount,
        date: r.date,
        vendor_name: r.vendor || null,
        description: r.description || null,
        payment_method: r.paymentMethod as any,
        status: 'actual' as any,
        expense_type: r.expenseType,
        notes: r.notes || null,
        cost_type: 'construction',
      }));

      const { error: insertError } = await supabase.from('expenses').insert(expenseRows);
      if (insertError) throw insertError;

      toast.success(`${rows.length} expenses imported successfully`);
      onImportComplete();
      handleClose(false);
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error('Import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const getCatLabel = (value: string) => allCategories.find(c => c.value === value)?.label || value;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
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
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); downloadSample(); }}
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
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
              >
                <Upload className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Upload CSV File</p>
                  <p className="text-sm text-muted-foreground">Select your expense file to begin</p>
                </div>
              </button>
            </div>

            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />

            {/* AI Prompt Helper */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Have messy data? Let AI format it for you</p>
                  <p className="text-xs text-muted-foreground">Paste this prompt into ChatGPT, Gemini, or Claude along with your raw data. Then save the output as a .csv file and upload it above.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleCopyPrompt(); }}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy Prompt'}
                </Button>
              </div>
              <pre className="text-xs text-muted-foreground bg-background rounded-md p-3 max-h-32 overflow-y-auto whitespace-pre-wrap border border-border">{aiPrompt}</pre>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-2">Required columns: Date, Category, Amount</p>
              <p>Optional: Vendor, Description, Payment Method (cash/check/card/transfer), Expense Type (product/labor), Notes</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1 text-success border-success">
                <CheckCircle2 className="h-3 w-3" />
                {readyRows.length} ready
              </Badge>
              {needsAttention.length > 0 && (
                <Badge variant="outline" className="gap-1 text-warning border-warning">
                  <AlertTriangle className="h-3 w-3" />
                  {needsAttention.length} need attention
                </Badge>
              )}
              <Badge variant="secondary">
                Total: ${rows.reduce((s, r) => s + r.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Badge>
            </div>

            {/* Preview table */}
            <div className="border rounded-lg overflow-auto max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Expense Type</TableHead>
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
                              <SelectTrigger className="h-7 text-xs w-[180px]">
                                <SelectValue placeholder="Assign category..." />
                              </SelectTrigger>
                              <SelectContent>
                                {allCategories.map(c => (
                                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{row.expenseType}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.hasError ? (
                          <Badge variant="destructive" className="text-xs">{row.errorMsg}</Badge>
                        ) : row.matchedCategory ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-warning" />
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
            <Button variant="outline" onClick={() => { setStep('upload'); setRows([]); }} className="mr-auto">
              Back
            </Button>
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

import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileImage, Loader2, Receipt, Trash2, Check, X, Sparkles, ChevronDown, ChevronUp, AlertCircle, Clipboard, Package, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BUDGET_CATEGORIES, type BudgetCategory } from '@/types';
import type { Project } from '@/types';
interface LineItem {
  id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  suggested_category: string;
  project_id?: string;
  notes?: string;
}

interface PendingReceipt {
  id: string;
  vendor_name: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  purchase_date: string;
  status: string;
  receipt_image_url?: string;
  matched_qb_id?: string;
  match_confidence?: number;
  line_items?: LineItem[];
}

interface MatchedExpense {
  receipt: PendingReceipt;
  qbExpense: {
    id: string;
    vendor_name: string;
    amount: number;
    date: string;
    description?: string;
  };
}

interface SmartSplitReceiptUploadProps {
  projects?: Project[];
  onReceiptProcessed?: () => void;
  onRefreshQBExpenses?: () => void;
}

export function SmartSplitReceiptUpload({ projects = [], onReceiptProcessed, onRefreshQBExpenses }: SmartSplitReceiptUploadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([]);
  const [matchedReceipts, setMatchedReceipts] = useState<MatchedExpense[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchedExpense | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const uploadZoneRef = useRef<HTMLDivElement>(null);
  const [editableCategories, setEditableCategories] = useState<Record<number, string>>({});
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [expenseType, setExpenseType] = useState<'product' | 'labor'>('product');
  const [isImporting, setIsImporting] = useState(false);

  // Handle paste events (Ctrl+V)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (isUploading) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFileUpload(file);
        }
        break;
      }
    }
  }, [isUploading]);

  // Add global paste listener when expanded
  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [isExpanded, handlePaste]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Capitalize first letter helper
  const capitalize = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Category options for the dropdown
  const categoryOptions = [
    'hardware', 'electrical', 'plumbing', 'flooring', 'painting', 
    'appliances', 'cabinets', 'countertops', 'doors', 'windows',
    'hvac', 'roofing', 'drywall', 'carpentry', 'landscaping',
    'demolition', 'misc', 'kitchen', 'bathroom', 'lighting'
  ];

  // Fetch pending receipts on mount
  const fetchPendingReceipts = useCallback(async () => {
    try {
      const { data: receipts, error } = await supabase
        .from('pending_receipts')
        .select('*')
        .in('status', ['pending', 'matched'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch line items for each receipt
      if (receipts && receipts.length > 0) {
        const receiptIds = receipts.map(r => r.id);
        const { data: lineItems } = await supabase
          .from('receipt_line_items')
          .select('*')
          .in('receipt_id', receiptIds);

        const receiptsWithItems = receipts.map(receipt => ({
          ...receipt,
          line_items: lineItems?.filter(item => item.receipt_id === receipt.id) || [],
        }));

        setPendingReceipts(receiptsWithItems);

        // Check for matched receipts and fetch QB expenses
        const matchedReceiptsData = receiptsWithItems.filter(r => r.status === 'matched' && r.matched_qb_id);
        if (matchedReceiptsData.length > 0) {
          const qbIds = matchedReceiptsData.map(r => r.matched_qb_id);
          const { data: qbExpenses } = await supabase
            .from('quickbooks_expenses')
            .select('*')
            .in('qb_id', qbIds);

          const matches: MatchedExpense[] = matchedReceiptsData.map(receipt => ({
            receipt,
            qbExpense: qbExpenses?.find(qb => qb.qb_id === receipt.matched_qb_id) || {
              id: '',
              vendor_name: 'Unknown',
              amount: receipt.total_amount,
              date: receipt.purchase_date,
            },
          }));

          setMatchedReceipts(matches);
        }
      } else {
        setPendingReceipts([]);
        setMatchedReceipts([]);
      }
    } catch (error) {
      console.error('Error fetching pending receipts:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingReceipts();
  }, [fetchPendingReceipts]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or PDF file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setIsParsing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('expense-receipts')
        .getPublicUrl(fileName);

      // Convert to base64 for AI parsing
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Parse receipt with AI
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-receipt-image', {
        body: { image_base64: base64 },
      });

      if (parseError) throw parseError;
      if (!parseResult.success) throw new Error(parseResult.error);

      const receiptData = parseResult.data;

      // Create pending receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('pending_receipts')
        .insert({
          user_id: user.id,
          vendor_name: receiptData.vendor_name,
          total_amount: receiptData.total_amount,
          tax_amount: receiptData.tax_amount,
          subtotal: receiptData.subtotal,
          purchase_date: receiptData.purchase_date,
          receipt_image_url: publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (receiptError) throw receiptError;

      // Create line items
      if (receiptData.line_items && receiptData.line_items.length > 0) {
        const lineItemsToInsert = receiptData.line_items.map((item: LineItem) => ({
          receipt_id: receipt.id,
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          suggested_category: item.suggested_category,
        }));

        await supabase.from('receipt_line_items').insert(lineItemsToInsert);
      }

      toast({
        title: 'Receipt uploaded!',
        description: `Parsed ${receiptData.line_items?.length || 0} items from ${receiptData.vendor_name}`,
      });

      await fetchPendingReceipts();
      onReceiptProcessed?.();

    } catch (error: any) {
      console.error('Error processing receipt:', error);
      toast({
        title: 'Failed to process receipt',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Run matching
  const runMatching = async () => {
    setIsMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-receipts');
      
      if (error) throw error;
      
      if (data.matches && data.matches.length > 0) {
        toast({
          title: 'Matches found!',
          description: `Found ${data.matches.length} receipt-transaction matches`,
        });
        await fetchPendingReceipts();
      } else {
        toast({
          title: 'No matches found',
          description: 'Receipts are waiting for transactions to appear in QuickBooks',
        });
      }
    } catch (error: any) {
      console.error('Error matching receipts:', error);
      toast({
        title: 'Matching failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsMatching(false);
    }
  };

  // Delete pending receipt
  const deleteReceipt = async (receiptId: string) => {
    try {
      await supabase.from('pending_receipts').delete().eq('id', receiptId);
      await fetchPendingReceipts();
      toast({ title: 'Receipt deleted' });
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  };

  // Accept match and open split modal
  const acceptMatch = (match: MatchedExpense) => {
    setSelectedMatch(match);
    // Initialize editable categories from suggested categories
    const initialCategories: Record<number, string> = {};
    match.receipt.line_items?.forEach((item, idx) => {
      initialCategories[idx] = item.suggested_category || 'misc';
    });
    setEditableCategories(initialCategories);
    setShowMatchModal(true);
  };

  // Finalize the import - create expense record and mark QB as imported
  const finalizeImport = async () => {
    if (!selectedMatch || !selectedProject) return;

    setIsImporting(true);
    
    try {
      // Build notes from line items for the expense
      const lineItemNotes = selectedMatch.receipt.line_items
        ?.map(item => `${item.item_name} (${item.quantity}x)`)
        .join(', ') || '';

      // Get the first line item's category (or use 'misc')
      const primaryCategory = (editableCategories[0] || 
        selectedMatch.receipt.line_items?.[0]?.suggested_category || 
        'misc') as BudgetCategory;

      // 1. Mark receipt as imported (removes from SmartSplit list)
      const { error: receiptError } = await supabase
        .from('pending_receipts')
        .update({ status: 'imported' })
        .eq('id', selectedMatch.receipt.id);

      if (receiptError) throw receiptError;

      // 2. Find or create project_category
      const { data: existingCategory } = await supabase
        .from('project_categories')
        .select('id')
        .eq('project_id', selectedProject)
        .eq('category', primaryCategory)
        .maybeSingle();

      let categoryId: string;
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category for project
        const { data: newCategory, error: categoryError } = await supabase
          .from('project_categories')
          .insert({
            project_id: selectedProject,
            category: primaryCategory,
            estimated_budget: 0,
          })
          .select('id')
          .single();

        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
      }

      // 3. Mark QB expense as imported with project/category (removes from pending list)
      const { error: qbError } = await supabase
        .from('quickbooks_expenses')
        .update({ 
          is_imported: true,
          notes: lineItemNotes,
          receipt_url: selectedMatch.receipt.receipt_image_url || null,
          project_id: selectedProject,
          category_id: categoryId,
          expense_type: expenseType,
        })
        .eq('id', selectedMatch.qbExpense.id);

      if (qbError) throw qbError;

      toast({
        title: 'Expense imported!',
        description: `${selectedMatch.receipt.vendor_name} expense added to project.`,
      });

      setShowMatchModal(false);
      setSelectedMatch(null);
      setSelectedProject('');
      setExpenseType('product');
      
      // Refresh both lists
      await fetchPendingReceipts();
      onRefreshQBExpenses?.();
      onReceiptProcessed?.();
    } catch (error: any) {
      console.error('Import failed:', error);
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const pendingCount = pendingReceipts.filter(r => r.status === 'pending').length;
  const matchedCount = matchedReceipts.length;

  return (
    <>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="glass-card overflow-hidden border-2 border-dashed border-primary/20">
          <CollapsibleTrigger asChild>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    SmartSplit Receipt Matching
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      Beta
                    </Badge>
                  </h3>
                  <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {pendingCount} waiting
                      </Badge>
                    )}
                    {matchedCount > 0 && (
                      <Badge variant="default" className="text-xs bg-success/20 text-success border-success/30">
                        {matchedCount} matched!
                      </Badge>
                    )}
                    {pendingCount === 0 && matchedCount === 0 && (
                      <span className="text-xs text-muted-foreground">Upload receipts now, auto-match later</span>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t border-border p-4 space-y-4">
              {/* Upload Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-all",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30",
                  isUploading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="receipt-upload"
                  disabled={isUploading}
                />
                <label htmlFor="receipt-upload" className="cursor-pointer">
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm font-medium">Parsing receipt with AI...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Drop receipt here or click to upload</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clipboard className="h-3 w-3" />
                        Tip: Paste with Ctrl+V • Supports images and PDFs
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Matched Receipts - Priority Display */}
              {matchedReceipts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" />
                    Matches Ready for Import
                  </h4>
                  {matchedReceipts.map((match) => (
                    <Card key={match.receipt.id} className="border-success/30 bg-success/5">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-success" />
                              <span className="font-medium">{match.receipt.vendor_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {match.receipt.match_confidence}% match
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(match.receipt.total_amount)} • {formatDate(match.receipt.purchase_date)}
                              {match.receipt.line_items && match.receipt.line_items.length > 0 && (
                                <span> • {match.receipt.line_items.length} items</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => acceptMatch(match)} className="gap-1">
                              <Check className="h-4 w-4" />
                              Import
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteReceipt(match.receipt.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pending Receipts */}
              {pendingReceipts.filter(r => r.status === 'pending').length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Awaiting Bank Transaction
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={runMatching}
                      disabled={isMatching}
                      className="gap-1"
                    >
                      {isMatching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Find Matches
                    </Button>
                  </div>
                  {pendingReceipts.filter(r => r.status === 'pending').map((receipt) => (
                    <Card key={receipt.id} className="border-warning/30 bg-warning/5">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <FileImage className="h-4 w-4 text-warning" />
                              <span className="font-medium">{receipt.vendor_name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(receipt.total_amount)} • {formatDate(receipt.purchase_date)}
                              {receipt.line_items && receipt.line_items.length > 0 && (
                                <span> • {receipt.line_items.length} items parsed</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteReceipt(receipt.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {pendingReceipts.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <p>Upload receipts right after purchase.</p>
                  <p>We'll auto-match when the charge hits QuickBooks (2-3 days).</p>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Match Approval Modal */}
      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              SmartSplit Match Found
            </DialogTitle>
            <DialogDescription>
              We matched your receipt to a QuickBooks transaction. Review the suggested split below.
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-4">
              {/* Match Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Receipt</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-medium">{selectedMatch.receipt.vendor_name}</p>
                    <p className="text-muted-foreground">{formatDate(selectedMatch.receipt.purchase_date)}</p>
                    <p className="font-mono font-semibold mt-1">{formatCurrency(selectedMatch.receipt.total_amount)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">QuickBooks Transaction</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="font-medium">{selectedMatch.qbExpense.vendor_name}</p>
                    <p className="text-muted-foreground">{formatDate(selectedMatch.qbExpense.date)}</p>
                    <p className="font-mono font-semibold mt-1">{formatCurrency(selectedMatch.qbExpense.amount)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Line Items */}
              {selectedMatch.receipt.line_items && selectedMatch.receipt.line_items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Suggested Split ({selectedMatch.receipt.line_items.length + (selectedMatch.receipt.tax_amount > 0 ? 1 : 0)} items)
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedMatch.receipt.line_items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded bg-muted/30 text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <Select
                          value={editableCategories[idx] || item.suggested_category || 'misc'}
                          onValueChange={(value) => setEditableCategories(prev => ({ ...prev, [idx]: value }))}
                        >
                          <SelectTrigger className="w-[130px] h-7 text-xs">
                            <SelectValue>{capitalize(editableCategories[idx] || item.suggested_category || 'misc')}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {capitalize(cat)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="font-mono">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                    
                    {/* Tax Line Item */}
                    {selectedMatch.receipt.tax_amount > 0 && (
                      <div className="flex items-center gap-3 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-sm">
                        <div className="flex-1">
                          <p className="font-medium">Sales Tax</p>
                          <p className="text-xs text-muted-foreground">
                            Applied to purchase
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Tax
                        </Badge>
                        <span className="font-mono">{formatCurrency(selectedMatch.receipt.tax_amount)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Split Total */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">Split Total</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(
                        selectedMatch.receipt.line_items.reduce((sum, item) => sum + item.total_price, 0) + 
                        (selectedMatch.receipt.tax_amount || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Project Selection & Type Toggle */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium">Import to Project</h4>
                
                <div className="space-y-3">
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-muted-foreground">Type:</Label>
                    <ToggleGroup
                      type="single"
                      value={expenseType}
                      onValueChange={(value) => value && setExpenseType(value as 'product' | 'labor')}
                      className="justify-start"
                    >
                      <ToggleGroupItem value="product" size="sm" className="gap-1">
                        <Package className="h-3 w-3" />
                        Product
                      </ToggleGroupItem>
                      <ToggleGroupItem value="labor" size="sm" className="gap-1">
                        <Wrench className="h-3 w-3" />
                        Labor
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMatchModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={finalizeImport} 
              disabled={!selectedProject || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Match & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

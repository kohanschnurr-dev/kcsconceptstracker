import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Paperclip, Download, Trash2, Save, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDisplayDateLong } from '@/lib/dateUtils';
import { getBudgetCategories } from '@/types';

interface ExpenseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    id: string;
    project_id: string;
    category_id: string;
    amount: number;
    date: string;
    vendor_name: string | null;
    payment_method: string | null;
    status: string;
    description: string | null;
    includes_tax: boolean;
    tax_amount: number | null;
    notes?: string | null;
    receipt_url?: string | null;
    source?: 'manual' | 'quickbooks';
    qb_id?: string;
    qb_expense_id?: string | null;
  } | null;
  projectName: string;
  categoryLabel: string;
  categories?: { id: string; category: string }[];
  onExpenseUpdated: () => void;
}

export function ExpenseDetailModal({
  open,
  onOpenChange,
  expense,
  projectName,
  categoryLabel,
  categories,
  onExpenseUpdated,
}: ExpenseDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (expense) {
      setNotes(expense.notes || '');
      setCategoryId(expense.category_id);
      setReceiptUrl(expense.receipt_url || null);
      setReceiptFile(null);
      setShowDeleteConfirm(false);
    }
  }, [expense]);

  if (!expense) return null;

  const isQuickBooks = expense.source === 'quickbooks';
  const isQbLinked = !!expense.qb_expense_id;
  const canSendBackToQueue = isQuickBooks || isQbLinked;
  // The expense row may be either a record in `quickbooks_expenses` (has qb_id, no qb_expense_id)
  // or a record in `expenses` linked to QB (has qb_expense_id). Updates must target the source table.
  const isFromQbTable = !!expense.qb_id && !expense.qb_expense_id;
  const tableName = isFromQbTable ? 'quickbooks_expenses' : 'expenses';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return formatDisplayDateLong(date);
  };

  const uploadReceipt = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${expense.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('expense-receipts')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('expense-receipts').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, or PDF file',
        variant: 'destructive',
      });
      return;
    }
    setReceiptFile(file);
    setReceiptUrl(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      setReceiptUrl(null);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptUrl(null);
  };

  const handleDownloadReceipt = async () => {
    if (!receiptUrl) return;
    try {
      const urlParts = receiptUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        // Fallback for external URLs - trigger download
        const link = document.createElement('a');
        link.href = receiptUrl;
        link.download = 'receipt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      const [bucketName, ...pathParts] = urlParts[1].split('/');
      const filePath = pathParts.join('/');
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
      
      if (error || !data) {
        toast({ title: 'Download failed', variant: 'destructive' });
        return;
      }
      
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filePath.split('/').pop() || 'receipt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const handleSendBackToQueue = async () => {
    setIsResetting(true);
    try {
      if (isQbLinked) {
        // This is a regular expense linked to a QB record via qb_expense_id
        // 1. Delete the regular expense
        const { error: deleteError } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expense.id);
        if (deleteError) throw deleteError;

        // 2. Reset the original QB record back to pending
        const { error: resetError } = await supabase
          .from('quickbooks_expenses')
          .update({
            is_imported: false,
            project_id: null,
            category_id: null,
            expense_type: null,
            notes: null,
            receipt_url: null,
          })
          .eq('id', expense.qb_expense_id!);
        if (resetError) throw resetError;
      } else {
        // This is a direct QB expense record
        // Delete any split records first
        const { data: expenseData } = await supabase
          .from('quickbooks_expenses')
          .select('qb_id')
          .eq('id', expense.id)
          .single();
        
        if (expenseData?.qb_id) {
          await supabase
            .from('quickbooks_expenses')
            .delete()
            .like('qb_id', `${expenseData.qb_id}_split_%`);
        }

        // Delete linked expenses from the expenses table
        await (supabase.from('expenses').delete() as any).eq('qb_expense_id', expense.id);
        
        // Reset the expense to pending
        const { error } = await supabase
          .from('quickbooks_expenses')
          .update({
            is_imported: false,
            project_id: null,
            category_id: null,
            expense_type: null,
            notes: null,
            receipt_url: null,
          })
          .eq('id', expense.id);
        if (error) throw error;
      }
      
      toast({ title: 'Expense sent back to queue' });
      onExpenseUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending back to queue:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to send expense back to queue',
        variant: 'destructive' 
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let newReceiptUrl = receiptUrl;

      // Upload new receipt if selected
      if (receiptFile) {
        setIsUploading(true);
        newReceiptUrl = await uploadReceipt(receiptFile);
        setIsUploading(false);
        if (!newReceiptUrl) {
          toast({
            title: 'Upload failed',
            description: 'Could not upload receipt',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }

      const updateData: Record<string, any> = {
        notes: notes || null,
        receipt_url: newReceiptUrl,
        ...(categoryId && categoryId !== expense.category_id ? { category_id: categoryId } : {}),
      };

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', expense.id);

      if (error) throw error;

      toast({
        title: 'Expense updated',
        description: 'Notes and receipt saved successfully',
      });

      onExpenseUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update expense',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      if (isQuickBooks) {
        // For QuickBooks expenses, reset to pending instead of deleting
        // First, delete any split records for this expense
        if (expense.qb_id) {
          await supabase
            .from('quickbooks_expenses')
            .delete()
            .like('qb_id', `${expense.qb_id}_split_%`);
        }

        // Delete linked expenses from the expenses table
        await (supabase.from('expenses').delete() as any).eq('qb_expense_id', expense.id);
        
        // Reset the main expense to pending
        const { error } = await supabase
          .from('quickbooks_expenses')
          .update({
            is_imported: false,
            project_id: null,
            category_id: null,
            expense_type: null,
            notes: null,
            receipt_url: null,
          })
          .eq('id', expense.id);

        if (error) throw error;
        
        toast({ title: 'Expense sent back to QuickBooks queue' });
      } else {
        // Delete from regular expenses table
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expense.id);

        if (error) throw error;
        
        toast({ title: 'Expense deleted successfully' });
      }

      onExpenseUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete expense',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setShowDeleteConfirm(false);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {showDeleteConfirm ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {isQuickBooks ? 'Remove from Project' : 'Delete Expense'}
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 text-primary" />
                Expense Details
                {isQuickBooks && (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                    QB
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {showDeleteConfirm ? (
          /* Delete Confirmation View */
          <div className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    {isQuickBooks 
                      ? 'This expense will be moved back to the QuickBooks pending queue for re-categorization.'
                      : 'Are you sure you want to delete this expense? This action cannot be undone.'
                    }
                  </p>
                  {isQuickBooks && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Any associated split records will be removed.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Expense Summary in Delete Confirmation */}
              <div className="bg-background/50 rounded-md p-3 mt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{expense.vendor_name || 'Unknown Contractor'}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                  </div>
                  <p className="font-mono font-semibold text-lg">{formatCurrency(expense.amount)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant={isQuickBooks ? "default" : "destructive"}
                className="flex-1 gap-2" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting 
                  ? 'Processing...' 
                  : isQuickBooks 
                    ? 'Move to Pending' 
                    : 'Delete'
                }
              </Button>
            </div>
          </div>
        ) : (
          /* Normal Details View */
          <div className="space-y-4">
            {/* Expense Summary */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">{expense.vendor_name || 'Unknown Contractor'}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-semibold">{formatCurrency(expense.amount)}</p>
                  {expense.includes_tax && expense.tax_amount && (
                    <p className="text-xs text-muted-foreground">+{formatCurrency(expense.tax_amount)} tax</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2 items-center">
                <Badge variant="secondary">{projectName}</Badge>
                {categories && categories.length > 0 ? (
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                  {categories.slice().sort((a, b) => {
                        const labelA = getBudgetCategories().find(c => c.value === a.category)?.label || a.category;
                        const labelB = getBudgetCategories().find(c => c.value === b.category)?.label || b.category;
                        return labelA.localeCompare(labelB);
                      }).map((cat) => {
                        const label = getBudgetCategories().find(b => b.value === cat.category)?.label || cat.category;
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{categoryLabel}</Badge>
                )}
                <Badge variant="outline" className="capitalize">{expense.payment_method}</Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    expense.status === 'actual' 
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-warning/10 text-warning border-warning/30'
                  )}
                >
                  {expense.status}
                </Badge>
              </div>

              {expense.description && (
                <p className="text-sm text-muted-foreground pt-2 border-t border-border mt-2">
                  {expense.description}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes about this expense..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>Receipt</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />

              {receiptUrl && !receiptFile ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <Paperclip className="h-5 w-5 text-primary" />
                  <span className="text-sm flex-1">Receipt attached</span>
                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    className="text-primary hover:text-primary/80"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveReceipt}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : receiptFile ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReceiptFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    isDragging 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Drag & drop or click to upload receipt
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP, or PDF
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {canSendBackToQueue && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-warning border-warning/50 hover:bg-warning/10"
                  onClick={handleSendBackToQueue}
                  disabled={isResetting}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isResetting ? 'Sending...' : 'Send Back to Queue'}
                </Button>
              )}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                >
                  <Save className="h-4 w-4" />
                  {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

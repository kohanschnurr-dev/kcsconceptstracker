import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText, Paperclip, ExternalLink, Trash2, Save, RotateCcw } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDisplayDateLong } from '@/lib/dateUtils';

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
  } | null;
  projectName: string;
  categoryLabel: string;
  onExpenseUpdated: () => void;
}

export function ExpenseDetailModal({
  open,
  onOpenChange,
  expense,
  projectName,
  categoryLabel,
  onExpenseUpdated,
}: ExpenseDetailModalProps) {
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (expense) {
      setNotes(expense.notes || '');
      setReceiptUrl(expense.receipt_url || null);
      setReceiptFile(null);
    }
  }, [expense]);

  if (!expense) return null;

  const isQuickBooks = expense.source === 'quickbooks';
  const tableName = isQuickBooks ? 'quickbooks_expenses' : 'expenses';

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

  const handleSendBackToQueue = async () => {
    setIsResetting(true);
    try {
      // Delete any split records first (if this is a parent of splits)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Expense Details
            {isQuickBooks && (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                QB
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Expense Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{expense.vendor_name || 'Unknown Vendor'}</p>
                <p className="text-sm text-muted-foreground">{formatDate(expense.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-semibold">{formatCurrency(expense.amount)}</p>
                {expense.includes_tax && expense.tax_amount && (
                  <p className="text-xs text-muted-foreground">+{formatCurrency(expense.tax_amount)} tax</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">{projectName}</Badge>
              <Badge variant="outline">{categoryLabel}</Badge>
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
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
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
            {isQuickBooks && (
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
                className="flex-1" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
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
      </DialogContent>
    </Dialog>
  );
}

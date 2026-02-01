import { useState } from 'react';
import { Paperclip, RotateCcw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDisplayDate } from '@/lib/dateUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DBExpense {
  id: string;
  project_id: string;
  category_id: string;
  amount: number;
  date: string;
  vendor_name: string | null;
  payment_method: 'cash' | 'check' | 'card' | 'transfer' | null;
  status: 'estimate' | 'actual';
  description: string | null;
  includes_tax: boolean;
  tax_amount: number | null;
  notes?: string | null;
  receipt_url?: string | null;
  source?: 'manual' | 'quickbooks';
  qb_id?: string | null;
}

interface GroupedExpenseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: DBExpense[];
  projectName: string;
  getCategoryLabel: (categoryId: string, projectId: string) => string;
  onExpenseUpdated: () => void;
}

export function GroupedExpenseDetailModal({
  open,
  onOpenChange,
  expenses,
  projectName,
  getCategoryLabel,
  onExpenseUpdated,
}: GroupedExpenseDetailModalProps) {
  const [isSendingBack, setIsSendingBack] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();

  if (!expenses.length) return null;

  // Get parent info from first expense
  const parentExpense = expenses[0];
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const hasReceipt = expenses.some(e => e.receipt_url);
  const receiptUrl = expenses.find(e => e.receipt_url)?.receipt_url;
  const isQuickBooks = parentExpense.source === 'quickbooks';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleViewReceipt = async () => {
    if (!receiptUrl) return;
    
    try {
      const urlParts = receiptUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        window.open(receiptUrl, '_blank');
        return;
      }
      
      const [bucketName, ...pathParts] = urlParts[1].split('/');
      const filePath = pathParts.join('/');
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
      
      if (error || !data) {
        window.open(receiptUrl, '_blank');
        return;
      }
      
      const blobUrl = URL.createObjectURL(data);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      window.open(receiptUrl, '_blank');
    }
  };

  const handleSendAllBackToQueue = async () => {
    if (!isQuickBooks) return;
    
    setIsSendingBack(true);
    try {
      // Get the parent qb_id (remove _split_* suffix if present)
      const parentQbId = parentExpense.qb_id?.replace(/_split_.*$/, '');
      if (!parentQbId) throw new Error('No QB ID found');

      // Get original amount and metadata from the first record
      const { data: firstRecord, error: fetchError } = await supabase
        .from('quickbooks_expenses')
        .select('original_amount, vendor_name, date, payment_method, receipt_url, user_id, account_name, expense_type')
        .or(`qb_id.eq.${parentQbId},qb_id.like.${parentQbId}_split_%`)
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      const originalAmount = firstRecord.original_amount || totalAmount;

      // Delete all split records for this parent
      const { error: deleteError } = await supabase
        .from('quickbooks_expenses')
        .delete()
        .like('qb_id', `${parentQbId}_split_%`);

      if (deleteError) throw deleteError;

      // Reset or create the parent record as pending
      const { error: upsertError } = await supabase
        .from('quickbooks_expenses')
        .upsert({
          qb_id: parentQbId,
          amount: originalAmount,
          original_amount: originalAmount,
          vendor_name: firstRecord.vendor_name,
          date: firstRecord.date,
          payment_method: firstRecord.payment_method,
          receipt_url: firstRecord.receipt_url,
          user_id: firstRecord.user_id,
          account_name: firstRecord.account_name,
          expense_type: firstRecord.expense_type,
          is_imported: false,
          project_id: null,
          category_id: null,
          description: null,
          notes: null,
        }, { onConflict: 'qb_id' });

      if (upsertError) throw upsertError;

      toast({
        title: 'Sent back to queue',
        description: `${expenses.length} items reset to pending`,
      });

      onOpenChange(false);
      onExpenseUpdated();
    } catch (error) {
      console.error('Error sending back to queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to send back to queue',
        variant: 'destructive',
      });
    } finally {
      setIsSendingBack(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      if (isQuickBooks) {
        // For QB expenses, delete from quickbooks_expenses
        const qbIds = expenses.map(e => e.qb_id).filter(Boolean);
        const { error } = await supabase
          .from('quickbooks_expenses')
          .delete()
          .in('qb_id', qbIds);
        
        if (error) throw error;
      } else {
        // For manual expenses, delete from expenses
        const ids = expenses.map(e => e.id);
        const { error } = await supabase
          .from('expenses')
          .delete()
          .in('id', ids);
        
        if (error) throw error;
      }

      toast({
        title: 'Deleted',
        description: `${expenses.length} items deleted`,
      });

      setShowDeleteConfirm(false);
      onOpenChange(false);
      onExpenseUpdated();
    } catch (error) {
      console.error('Error deleting expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete expenses',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="flex items-center gap-2">
                Receipt Details
                {isQuickBooks && (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                    QB
                  </Badge>
                )}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Header */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{parentExpense.vendor_name || 'Unknown Vendor'}</h3>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {formatDisplayDate(parentExpense.date)} • {parentExpense.payment_method || 'N/A'}
                </span>
                <span className="text-lg font-mono font-semibold text-foreground">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Project: {projectName}</p>
            </div>

            <Separator />

            {/* Items List */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{expenses.length} Items</p>
              <ScrollArea className="max-h-[240px] rounded-md border">
                <div className="divide-y">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="p-3 hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {getCategoryLabel(expense.category_id, expense.project_id)}
                          </Badge>
                          {/* Show notes as primary text (contains actual item descriptions) */}
                          {expense.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed" title={expense.notes}>
                              {expense.notes}
                            </p>
                          )}
                          {/* Only show description if there's no notes AND it's not just a vendor address */}
                          {!expense.notes && expense.description && !expense.description.includes('XXXX') && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {expense.description}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-sm font-medium whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Receipt Button */}
            {hasReceipt && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleViewReceipt}
              >
                <Paperclip className="h-4 w-4" />
                View Receipt
              </Button>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              {isQuickBooks && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleSendAllBackToQueue}
                  disabled={isSendingBack}
                >
                  <RotateCcw className="h-4 w-4" />
                  {isSendingBack ? 'Sending...' : 'Send All Back to Queue'}
                </Button>
              )}
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all {expenses.length} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all items in this receipt group. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

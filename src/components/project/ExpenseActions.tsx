import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TEXAS_SALES_TAX, getBudgetCategories } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Category {
  id: string;
  category: string;
  estimated_budget: number;
}

interface Expense {
  id: string;
  project_id: string;
  category_id: string;
  vendor_name: string | null;
  description: string | null;
  amount: number;
  date: string;
  payment_method: string | null;
  includes_tax: boolean;
  tax_amount: number | null;
  status: string;
  isQuickBooks?: boolean; // Flag to identify QB expenses
  qb_id?: string; // QuickBooks ID for finding related splits
}

interface EditExpenseModalProps {
  expense: Expense | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseUpdated: () => void;
}

export function EditExpenseModal({ expense, categories, open, onOpenChange, onExpenseUpdated }: EditExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [includesTax, setIncludesTax] = useState(false);
  const [status, setStatus] = useState('actual');

  useEffect(() => {
    if (expense) {
      setCategoryId(expense.category_id);
      setAmount(expense.amount.toString());
      setVendorName(expense.vendor_name || '');
      setDescription(expense.description || '');
      setDate(expense.date);
      setPaymentMethod(expense.payment_method || '');
      setIncludesTax(expense.includes_tax);
      setStatus(expense.status);
    }
  }, [expense]);

  const getCategoryName = (categoryValue: string) => {
    return getBudgetCategories().find(b => b.value === categoryValue)?.label || categoryValue;
  };

  const calculateTax = () => {
    const amt = parseFloat(amount) || 0;
    return amt * TEXAS_SALES_TAX;
  };

  const handleSubmit = async () => {
    if (!expense || !categoryId || !amount) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);

    const taxAmount = includesTax ? calculateTax() : null;

    let error;

    if (expense.isQuickBooks) {
      // Update QuickBooks expense table
      const result = await supabase
        .from('quickbooks_expenses')
        .update({
          category_id: categoryId,
          amount: parseFloat(amount),
          vendor_name: vendorName || null,
          description: description || null,
          date: date,
          payment_method: paymentMethod || null,
        })
        .eq('id', expense.id);
      error = result.error;
    } else {
      // Update regular expense table
      const result = await supabase
        .from('expenses')
        .update({
          category_id: categoryId,
          amount: parseFloat(amount),
          vendor_name: vendorName || null,
          description: description || null,
          date: date,
          payment_method: (paymentMethod || null) as 'cash' | 'check' | 'card' | 'transfer' | null,
          includes_tax: includesTax,
          tax_amount: taxAmount,
          status: status as 'estimate' | 'actual',
        })
        .eq('id', expense.id);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast.error('Failed to update expense');
      console.error(error);
      return;
    }

    toast.success('Expense updated successfully');
    onExpenseUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {getCategoryName(cat.category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contractor</Label>
            <Input
              placeholder="Contractor name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="financed">Financed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actual">Actual</SelectItem>
                  <SelectItem value="estimate">Estimate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label>Include TX Sales Tax (8.25%)</Label>
              {includesTax && (
                <p className="text-sm text-muted-foreground">
                  Tax: ${calculateTax().toFixed(2)}
                </p>
              )}
            </div>
            <Switch checked={includesTax} onCheckedChange={setIncludesTax} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseDeleted: () => void;
}

export function DeleteExpenseDialog({ expense, open, onOpenChange, onExpenseDeleted }: DeleteExpenseDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!expense) return;

    setLoading(true);

    let error;
    
    if (expense.isQuickBooks) {
      // For QuickBooks expenses, reset to pending instead of deleting
      // This allows them to reappear in the QuickBooks pending queue
      
      // First, delete any split records for this expense
      if (expense.qb_id) {
        const { error: splitError } = await supabase
          .from('quickbooks_expenses')
          .delete()
          .like('qb_id', `${expense.qb_id}_split_%`);
        
        if (splitError) {
          console.error('Error deleting split records:', splitError);
        }
      }
      
      // Reset the main expense to pending (instead of deleting)
      const result = await supabase
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
      error = result.error;
    } else {
      // Delete from regular expenses table
      const result = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast.error('Failed to process expense');
      console.error(error);
      return;
    }

    toast.success(expense.isQuickBooks 
      ? 'Expense moved back to QuickBooks pending queue' 
      : 'Expense deleted successfully'
    );
    onExpenseDeleted();
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {expense?.isQuickBooks ? 'Remove from Project' : 'Delete Expense'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {expense?.isQuickBooks ? (
              <>
                This expense will be moved back to the QuickBooks pending queue for re-categorization.
                {expense && (
                  <span className="block mt-2 font-medium text-foreground">
                    {expense.vendor_name || 'Unknown vendor'} - {formatCurrency(Number(expense.amount))}
                  </span>
                )}
                Any associated split records will be removed.
              </>
            ) : (
              <>
                Are you sure you want to delete this expense?
                {expense && (
                  <span className="block mt-2 font-medium text-foreground">
                    {expense.vendor_name || 'Unknown vendor'} - {formatCurrency(Number(expense.amount))}
                  </span>
                )}
                This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className={expense?.isQuickBooks 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {expense?.isQuickBooks ? 'Move to Pending' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

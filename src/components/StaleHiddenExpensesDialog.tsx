import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface StaleHiddenExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  totalAmount: number;
  onDelete: () => void;
  onAutoDeleteChange: (enabled: boolean) => void;
}

export function StaleHiddenExpensesDialog({
  open,
  onOpenChange,
  count,
  totalAmount,
  onDelete,
  onAutoDeleteChange,
}: StaleHiddenExpensesDialogProps) {
  const [autoDelete, setAutoDelete] = useState(false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleAutoDeleteChange = (checked: boolean) => {
    setAutoDelete(checked);
    onAutoDeleteChange(checked);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clean Up Hidden Expenses</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                You have <span className="font-semibold text-foreground">{count}</span> hidden
                expense{count !== 1 ? 's' : ''} older than 30 days, totaling{' '}
                <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>.
              </p>
              <p>Would you like to permanently delete them?</p>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="auto-delete-stale"
                  checked={autoDelete}
                  onCheckedChange={(checked) => handleAutoDeleteChange(checked === true)}
                />
                <Label htmlFor="auto-delete-stale" className="text-sm font-normal cursor-pointer">
                  Automatically delete hidden expenses after 30 days
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

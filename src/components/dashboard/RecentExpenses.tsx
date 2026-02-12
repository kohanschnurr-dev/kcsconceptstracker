import { CreditCard, DollarSign, Check, FileText } from 'lucide-react';
import { Expense, getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';
import { formatDisplayDateShort } from '@/lib/dateUtils';

interface RecentExpensesProps {
  expenses: Expense[];
  projectCategories?: { id: string; category: string }[];
}

export function RecentExpenses({ expenses, projectCategories }: RecentExpensesProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return formatDisplayDateShort(date);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'card':
        return CreditCard;
      case 'check':
        return FileText;
      default:
        return DollarSign;
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    if (!projectCategories) return categoryId;
    const cat = projectCategories.find(c => c.id === categoryId);
    if (!cat) return categoryId;
    return getBudgetCategories().find(b => b.value === cat.category)?.label || cat.category;
  };

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Recent Expenses</h3>
        <span className="text-xs text-muted-foreground">{expenses.length} total</span>
      </div>
      
      <div className="divide-y divide-border">
        {expenses.slice(0, 5).map((expense) => {
          const PaymentIcon = getPaymentIcon(expense.paymentMethod);
          
          return (
            <div key={expense.id} className="p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{expense.vendorName}</span>
                    <span className="font-mono font-medium text-sm whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {getCategoryLabel(expense.categoryId)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(expense.date)}
                    </span>
                    {expense.status === 'actual' && (
                      <Check className="h-3 w-3 text-success" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {expenses.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No expenses yet</p>
        </div>
      )}
    </div>
  );
}

import { Receipt } from 'lucide-react';

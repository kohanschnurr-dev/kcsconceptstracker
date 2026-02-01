import { useState } from 'react';
import { ChevronDown, ChevronRight, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/dateUtils';

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
}

interface GroupedExpenseRowProps {
  expenses: DBExpense[];
  getProjectName: (projectId: string) => string;
  getCategoryLabel: (categoryId: string, projectId: string) => string;
  formatCurrency: (amount: number) => string;
  handleViewReceipt: (receiptUrl: string, e: React.MouseEvent) => void;
  onExpenseClick: (expense: DBExpense) => void;
}

export function GroupedExpenseRow({
  expenses,
  getProjectName,
  getCategoryLabel,
  formatCurrency,
  handleViewReceipt,
  onExpenseClick,
}: GroupedExpenseRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get the first expense for shared data (date, vendor, project, payment method)
  const parentExpense = expenses[0];
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const hasMultipleCategories = expenses.length > 1;
  
  // Check if any expense has a receipt
  const hasReceipt = expenses.some(e => e.receipt_url);
  
  // Get unique categories for display when expanded
  const categories = expenses.map(e => getCategoryLabel(e.category_id, e.project_id));
  
  if (!hasMultipleCategories) {
    // Single expense - render normally without collapsible
    const expense = expenses[0];
    return (
      <tr 
        className="hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => onExpenseClick(expense)}
      >
        <td className="whitespace-nowrap">{formatDisplayDate(expense.date)}</td>
        <td>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{expense.vendor_name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {expense.description}
              </p>
              {expense.notes && (
                <p className="text-xs text-muted-foreground/70 italic truncate max-w-[200px]">
                  Note: {expense.notes}
                </p>
              )}
            </div>
            <div className="w-8 flex-shrink-0 flex justify-end">
              {expense.source === 'quickbooks' && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                  QB
                </Badge>
              )}
            </div>
          </div>
        </td>
        <td className="!text-center">{getProjectName(expense.project_id)}</td>
        <td className="!text-center">
          <Badge variant="secondary" className="text-xs">
            {getCategoryLabel(expense.category_id, expense.project_id)}
          </Badge>
        </td>
        <td className="!text-center capitalize">{expense.payment_method}</td>
        <td className="!text-center">
          <div className="flex items-center justify-center gap-2">
            {expense.receipt_url && (
              <button
                onClick={(e) => handleViewReceipt(expense.receipt_url!, e)}
                className="text-primary hover:text-primary/80 transition-colors"
                title="View receipt"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            )}
            <span className="font-mono">
              {formatCurrency(expense.amount)}
              {expense.includes_tax && (
                <span className="text-xs text-muted-foreground ml-1">+tax</span>
              )}
            </span>
          </div>
        </td>
      </tr>
    );
  }
  
  // Multiple expenses - render collapsible group
  return (
    <>
      {/* Parent row - clickable to open detail, arrow to expand */}
      <tr 
        className="hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={() => onExpenseClick(parentExpense)}
      >
        <td className="whitespace-nowrap">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 -ml-1 hover:bg-muted/50 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {formatDisplayDate(parentExpense.date)}
          </div>
        </td>
        <td>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{parentExpense.vendor_name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">
                {expenses.length} items • Click arrow to expand
              </p>
            </div>
            <div className="w-8 flex-shrink-0 flex justify-end">
              {parentExpense.source === 'quickbooks' && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                  QB
                </Badge>
              )}
            </div>
          </div>
        </td>
        <td className="!text-center">{getProjectName(parentExpense.project_id)}</td>
        <td className="!text-center">
          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
            Multiple
          </Badge>
        </td>
        <td className="!text-center capitalize">{parentExpense.payment_method}</td>
        <td className="!text-center">
          <div className="flex items-center justify-center gap-2">
            {hasReceipt && (
              <Paperclip className="h-4 w-4 text-primary" />
            )}
            <span className="font-mono font-semibold">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </td>
      </tr>
      
      {/* Child rows - expanded details */}
      {isExpanded && expenses.map((expense, index) => (
        <tr 
          key={expense.id}
          className="bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer border-l-2 border-primary/30"
          onClick={(e) => {
            e.stopPropagation();
            onExpenseClick(expense);
          }}
        >
          <td className="whitespace-nowrap pl-8 text-muted-foreground text-sm">
            └─
          </td>
          <td>
            <div>
              <p className="text-sm">{expense.description || `Item ${index + 1}`}</p>
              {expense.notes && (
                <p className="text-xs text-muted-foreground/70 italic truncate max-w-[200px]">
                  Note: {expense.notes}
                </p>
              )}
            </div>
          </td>
          <td className="!text-center text-muted-foreground text-sm">—</td>
          <td className="!text-center">
            <Badge variant="secondary" className="text-xs">
              {getCategoryLabel(expense.category_id, expense.project_id)}
            </Badge>
          </td>
          <td className="!text-center text-muted-foreground text-sm">—</td>
          <td className="!text-center">
            <span className="font-mono text-sm">
              {formatCurrency(expense.amount)}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

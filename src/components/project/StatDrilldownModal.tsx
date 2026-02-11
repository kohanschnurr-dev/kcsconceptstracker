import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, Receipt, Calendar, CreditCard, FileText, Banknote } from 'lucide-react';
import { formatDisplayDate } from '@/lib/dateUtils';

interface Category {
  id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  vendor_name: string | null;
  description: string | null;
  payment_method: string | null;
  category_id: string;
  includes_tax: boolean;
  tax_amount: number | null;
  status: string;
}

interface StatDrilldownModalProps {
  type: 'budget' | 'spent' | 'remaining' | 'expenses' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalBudget: number;
  totalSpent: number;
  categories: Category[];
  expenses: Expense[];
}

export function StatDrilldownModal({ 
  type, 
  open, 
  onOpenChange, 
  totalBudget, 
  totalSpent, 
  categories, 
  expenses 
}: StatDrilldownModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return formatDisplayDate(date);
  };

  const getCategoryLabel = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return 'Unknown';
    return getBudgetCategories().find(b => b.value === cat.category)?.label || cat.category;
  };

  const getCategoryName = (categoryValue: string) => {
    return getBudgetCategories().find(b => b.value === categoryValue)?.label || categoryValue;
  };

  const getPaymentIcon = (method: string | null) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'check':
        return <FileText className="h-4 w-4" />;
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const remaining = totalBudget - totalSpent;

  const getTitle = () => {
    switch (type) {
      case 'budget': return 'Budget Breakdown';
      case 'spent': return 'Spending Details';
      case 'remaining': return 'Remaining by Category';
      case 'expenses': return 'All Expenses';
      default: return '';
    }
  };

  const renderBudgetContent = () => {
    const sortedCategories = [...categories].sort((a, b) => b.estimated_budget - a.estimated_budget);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(totalBudget)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {sortedCategories.map((cat) => {
            const percentage = (cat.estimated_budget / totalBudget) * 100;
            return (
              <div key={cat.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{getCategoryName(cat.category)}</span>
                  <span className="font-mono font-semibold">{formatCurrency(cat.estimated_budget)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground w-12 text-right">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpentContent = () => {
    const categorySpending = categories
      .filter(c => c.actualSpent > 0)
      .sort((a, b) => b.actualSpent - a.actualSpent);
    
    const topVendors = expenses.reduce((acc, exp) => {
      const vendor = exp.vendor_name || 'Unknown';
      acc[vendor] = (acc[vendor] || 0) + Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    const sortedVendors = Object.entries(topVendors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold font-mono text-warning">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">% of Budget</p>
              <p className="text-2xl font-bold">{((totalSpent / totalBudget) * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Spending by Category</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {categorySpending.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm">{getCategoryName(cat.category)}</span>
                  <span className="font-mono text-sm font-medium">{formatCurrency(cat.actualSpent)}</span>
                </div>
              ))}
              {categorySpending.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No spending yet</p>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Top Vendors</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {sortedVendors.map(([vendor, amount]) => (
                <div key={vendor} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm truncate max-w-[150px]">{vendor}</span>
                  <span className="font-mono text-sm font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              {sortedVendors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No vendors yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRemainingContent = () => {
    const categoriesWithRemaining = categories
      .map(cat => ({
        ...cat,
        remaining: cat.estimated_budget - cat.actualSpent,
        percentUsed: cat.estimated_budget > 0 ? (cat.actualSpent / cat.estimated_budget) * 100 : 0
      }))
      .sort((a, b) => a.remaining - b.remaining);

    const overBudgetCategories = categoriesWithRemaining.filter(c => c.remaining < 0);
    const atRiskCategories = categoriesWithRemaining.filter(c => c.remaining >= 0 && c.percentUsed >= 80);
    const healthyCategories = categoriesWithRemaining.filter(c => c.remaining >= 0 && c.percentUsed < 80);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className={cn("border-2", remaining >= 0 ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20")}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Remaining</p>
              <p className={cn("text-xl font-bold font-mono", remaining >= 0 ? "text-success" : "text-destructive")}>
                {formatCurrency(remaining)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Over Budget</p>
              <p className="text-xl font-bold text-destructive">{overBudgetCategories.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/10 border-warning/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">At Risk (80%+)</p>
              <p className="text-xl font-bold text-warning">{atRiskCategories.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {categoriesWithRemaining.map((cat) => (
            <div 
              key={cat.id} 
              className={cn(
                "p-3 rounded-lg border",
                cat.remaining < 0 && "bg-destructive/5 border-destructive/30",
                cat.remaining >= 0 && cat.percentUsed >= 80 && "bg-warning/5 border-warning/30",
                cat.remaining >= 0 && cat.percentUsed < 80 && "bg-muted/30 border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getCategoryName(cat.category)}</span>
                  {cat.remaining < 0 && (
                    <Badge variant="destructive" className="text-xs">Over</Badge>
                  )}
                  {cat.remaining >= 0 && cat.percentUsed >= 80 && (
                    <Badge variant="outline" className="text-xs text-warning border-warning">At Risk</Badge>
                  )}
                </div>
                <span className={cn(
                  "font-mono font-semibold",
                  cat.remaining < 0 ? "text-destructive" : "text-success"
                )}>
                  {formatCurrency(cat.remaining)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatCurrency(cat.actualSpent)} spent of {formatCurrency(cat.estimated_budget)}</span>
                <span>•</span>
                <span>{cat.percentUsed.toFixed(0)}% used</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExpensesContent = () => {
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const totalWithTax = expenses.reduce((sum, exp) => {
      return sum + Number(exp.amount) + (Number(exp.tax_amount) || 0);
    }, 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="bg-warning/5 border-warning/20">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">With Tax</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(totalWithTax)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="max-h-[350px] overflow-y-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-sm">{formatDate(exp.date)}</TableCell>
                  <TableCell className="font-medium text-sm max-w-[150px] truncate">
                    {exp.vendor_name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getCategoryLabel(exp.category_id)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(Number(exp.amount))}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      {getPaymentIcon(exp.payment_method)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No expenses recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'budget': return renderBudgetContent();
      case 'spent': return renderSpentContent();
      case 'remaining': return renderRemainingContent();
      case 'expenses': return renderExpensesContent();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'budget' && <DollarSign className="h-5 w-5 text-primary" />}
            {type === 'spent' && <TrendingUp className="h-5 w-5 text-warning" />}
            {type === 'remaining' && <TrendingDown className="h-5 w-5 text-success" />}
            {type === 'expenses' && <Receipt className="h-5 w-5 text-muted-foreground" />}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

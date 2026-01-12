import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Download, Receipt, Briefcase, TrendingUp, Calendar } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BUSINESS_EXPENSE_CATEGORIES, ALL_CATEGORIES, KCS_CONCEPTS_PROJECT_NAME, type Project, type CategoryBudget } from '@/types';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { QuickBooksIntegration } from '@/components/QuickBooksIntegration';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
  source?: 'manual' | 'quickbooks';
}

interface DBQuickBooksExpense {
  id: string;
  project_id: string | null;
  category_id: string | null;
  amount: number;
  date: string;
  vendor_name: string | null;
  payment_method: string | null;
  description: string | null;
  is_imported: boolean;
}

export default function BusinessExpenses() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [kcsProject, setKcsProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<DBExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch KCS Concepts project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('name', KCS_CONCEPTS_PROJECT_NAME)
        .single();

      if (projectError && projectError.code !== 'PGRST116') throw projectError;

      if (!projectData) {
        setIsLoading(false);
        return;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('project_categories')
        .select('*')
        .eq('project_id', projectData.id);

      if (categoriesError) throw categoriesError;

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectData.id)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch imported QuickBooks expenses for this project
      const { data: qbExpensesData, error: qbExpensesError } = await supabase
        .from('quickbooks_expenses')
        .select('*')
        .eq('is_imported', true)
        .eq('project_id', projectData.id)
        .not('category_id', 'is', null)
        .order('date', { ascending: false });

      if (qbExpensesError) throw qbExpensesError;

      const transformedProject: Project = {
        id: projectData.id,
        name: projectData.name,
        address: projectData.address,
        totalBudget: projectData.total_budget,
        startDate: projectData.start_date,
        status: projectData.status === 'on_hold' ? 'on-hold' : projectData.status as 'active' | 'complete',
        categories: (categoriesData || []).map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          category: c.category as CategoryBudget['category'],
          estimatedBudget: c.estimated_budget,
          actualSpent: 0,
        })),
      };

      // Combine manual expenses with imported QuickBooks expenses
      const manualExpenses: DBExpense[] = (expensesData || []).map(e => ({
        ...e,
        source: 'manual' as const,
      }));

      const qbExpenses: DBExpense[] = (qbExpensesData || [])
        .filter((e: DBQuickBooksExpense) => e.project_id && e.category_id)
        .map((e: DBQuickBooksExpense) => ({
          id: e.id,
          project_id: e.project_id!,
          category_id: e.category_id!,
          amount: e.amount,
          date: e.date,
          vendor_name: e.vendor_name,
          payment_method: e.payment_method as DBExpense['payment_method'],
          status: 'actual' as const,
          description: e.description,
          includes_tax: false,
          tax_amount: null,
          source: 'quickbooks' as const,
        }));

      const allExpenses = [...manualExpenses, ...qbExpenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setKcsProject(transformedProject);
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business expenses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = kcsProject?.categories.find(c => c.id === categoryId);
    if (!category) return categoryId;
    return ALL_CATEGORIES.find(b => b.value === category.category)?.label || category.category;
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = 
        (expense.vendor_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (expense.description?.toLowerCase() || '').includes(search.toLowerCase());
      
      let matchesCategory = categoryFilter === 'all';
      if (!matchesCategory) {
        const category = kcsProject?.categories.find(c => c.id === expense.category_id);
        matchesCategory = category?.category === categoryFilter;
      }

      let matchesDateRange = true;
      if (dateRange?.from) {
        const expenseDate = new Date(expense.date);
        matchesDateRange = isAfter(expenseDate, startOfDay(dateRange.from)) || 
                          expenseDate.toDateString() === dateRange.from.toDateString();
        if (dateRange.to) {
          matchesDateRange = matchesDateRange && 
            (isBefore(expenseDate, endOfDay(dateRange.to)) || 
             expenseDate.toDateString() === dateRange.to.toDateString());
        }
      }

      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }, [expenses, search, categoryFilter, dateRange, kcsProject]);

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = kcsProject?.categories.find(c => c.id === expense.category_id);
      if (category) {
        totals[category.category] = (totals[category.category] || 0) + Number(expense.amount);
      }
    });
    return totals;
  }, [expenses, kcsProject]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const thisMonthTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return expenseDate >= startOfMonth(now) && expenseDate <= endOfMonth(now);
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const lastMonthTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      const lastMonth = subMonths(new Date(), 1);
      return expenseDate >= startOfMonth(lastMonth) && expenseDate <= endOfMonth(lastMonth);
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Category', 'Payment Method', 'Amount', 'Description'];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.vendor_name || '',
      getCategoryLabel(e.category_id),
      e.payment_method || '',
      e.amount.toString(),
      e.description || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kcs-concepts-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast({
      title: 'Export complete',
      description: `${filteredExpenses.length} expenses exported to CSV`,
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header - Different styling for business */}
        <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl p-6 border border-blue-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">KCS Concepts</h1>
                <p className="text-muted-foreground">Business Operating Expenses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={exportToCSV}>
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="gap-2" onClick={() => setExpenseModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-xl font-semibold font-mono">{formatCurrency(thisMonthTotal)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Month</p>
                <p className="text-xl font-semibold font-mono">{formatCurrency(lastMonthTotal)}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-semibold font-mono">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {BUSINESS_EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[180px] justify-start">
                <Calendar className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span>{format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}</span>
                  ) : (
                    <span>{format(dateRange.from, 'MMM d, yyyy')}</span>
                  )
                ) : (
                  <span>Date Range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                className="pointer-events-auto"
              />
              {dateRange && (
                <div className="p-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setDateRange(undefined)}
                  >
                    Clear dates
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* QuickBooks Integration */}
        {kcsProject && (
          <QuickBooksIntegration projects={[kcsProject]} onExpenseImported={fetchData} />
        )}

        {/* Category Breakdown */}
        <div className="glass-card p-4">
          <h3 className="font-medium mb-4">Expense Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BUSINESS_EXPENSE_CATEGORIES.map((cat) => {
              const total = categoryTotals[cat.value] || 0;
              if (total === 0) return null;
              return (
                <div key={cat.value} className="p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground truncate">{cat.label}</p>
                  <p className="font-mono font-semibold">{formatCurrency(total)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-muted/30">
                  <th>Date</th>
                  <th>Vendor / Description</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/20 transition-colors">
                    <td className="whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{expense.vendor_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                            {expense.description}
                          </p>
                        </div>
                        {expense.source === 'quickbooks' && (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                            QB
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                        {getCategoryLabel(expense.category_id)}
                      </Badge>
                    </td>
                    <td className="capitalize">{expense.payment_method}</td>
                    <td className="text-right font-mono font-semibold">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No business expenses found</p>
            </div>
          )}
        </div>
      </div>

      {kcsProject && (
        <QuickExpenseModal
          open={expenseModalOpen}
          onOpenChange={setExpenseModalOpen}
          projects={[kcsProject]}
        />
      )}
    </MainLayout>
  );
}
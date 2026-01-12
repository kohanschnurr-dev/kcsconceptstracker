import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Download, Receipt, Calendar } from 'lucide-react';
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
import { BUDGET_CATEGORIES, type Project, type CategoryBudget } from '@/types';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { QuickBooksIntegration } from '@/components/QuickBooksIntegration';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DBProject {
  id: string;
  name: string;
  address: string;
  total_budget: number;
  start_date: string;
  status: 'active' | 'complete' | 'on_hold';
}

interface DBCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number;
}

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

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<DBExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch projects with their categories
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('project_categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch imported QuickBooks expenses
      const { data: qbExpensesData, error: qbExpensesError } = await supabase
        .from('quickbooks_expenses')
        .select('*')
        .eq('is_imported', true)
        .not('project_id', 'is', null)
        .not('category_id', 'is', null)
        .order('date', { ascending: false });

      if (qbExpensesError) throw qbExpensesError;

      // Transform to match Project type
      const transformedProjects: Project[] = (projectsData || []).map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        totalBudget: p.total_budget,
        startDate: p.start_date,
        status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
        categories: (categoriesData || [])
          .filter((c: DBCategory) => c.project_id === p.id)
          .map((c: DBCategory) => ({
            id: c.id,
            projectId: c.project_id,
            category: c.category as CategoryBudget['category'],
            estimatedBudget: c.estimated_budget,
            actualSpent: 0,
          })),
      }));

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

      setProjects(transformedProjects);
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
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

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || projectId;
  };

  const getCategoryLabel = (categoryId: string, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const category = project?.categories.find(c => c.id === categoryId);
    if (!category) return categoryId;
    return BUDGET_CATEGORIES.find(b => b.value === category.category)?.label || category.category;
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = 
        (expense.vendor_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (expense.description?.toLowerCase() || '').includes(search.toLowerCase());
      
      const matchesProject = projectFilter === 'all' || expense.project_id === projectFilter;
      
      // For category filter, we need to check the category of the expense
      let matchesCategory = categoryFilter === 'all';
      if (!matchesCategory) {
        const project = projects.find(p => p.id === expense.project_id);
        const category = project?.categories.find(c => c.id === expense.category_id);
        matchesCategory = category?.category === categoryFilter;
      }

      // Date range filter
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

      return matchesSearch && matchesProject && matchesCategory && matchesDateRange;
    });
  }, [expenses, search, projectFilter, categoryFilter, dateRange, projects]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Project', 'Category', 'Payment Method', 'Amount', 'Tax', 'Status', 'Description'];
    const rows = filteredExpenses.map(e => [
      e.date,
      e.vendor_name || '',
      getProjectName(e.project_id),
      getCategoryLabel(e.category_id, e.project_id),
      e.payment_method || '',
      e.amount.toString(),
      e.tax_amount?.toString() || '0',
      e.status,
      e.description || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast({
      title: 'Export complete',
      description: `${filteredExpenses.length} expenses exported to CSV`,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Expenses</h1>
            <p className="text-muted-foreground mt-1">Track all project costs</p>
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
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {BUDGET_CATEGORIES.map((cat) => (
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
        <QuickBooksIntegration projects={projects} onExpenseImported={fetchData} />

        {/* Summary */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {filteredExpenses.length} expenses
              </p>
              <p className="text-xl font-semibold font-mono">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>TX Sales Tax (8.25%)</p>
            <p className="font-mono text-foreground">
              {formatCurrency(filteredExpenses.filter(e => e.includes_tax).reduce((sum, e) => sum + (e.tax_amount || 0), 0))}
            </p>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="bg-muted/30">
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Payment</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{expense.vendor_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
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
                    <td>{getProjectName(expense.project_id)}</td>
                    <td>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(expense.category_id, expense.project_id)}
                      </Badge>
                    </td>
                    <td className="capitalize">{expense.payment_method}</td>
                    <td className="text-right font-mono">
                      {formatCurrency(expense.amount)}
                      {expense.includes_tax && (
                        <span className="text-xs text-muted-foreground ml-1">+tax</span>
                      )}
                    </td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No expenses found</p>
            </div>
          )}
        </div>
      </div>

      <QuickExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        projects={projects}
      />
    </MainLayout>
  );
}

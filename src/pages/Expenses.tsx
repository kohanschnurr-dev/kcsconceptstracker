import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Download, Receipt, Calendar, Paperclip, ChevronDown, X } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { getBudgetCategories, getAllCategories, type Project, type CategoryBudget } from '@/types';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { QuickBooksIntegration } from '@/components/QuickBooksIntegration';
import { ExpenseDetailModal } from '@/components/ExpenseDetailModal';
import { GroupedExpenseDetailModal } from '@/components/GroupedExpenseDetailModal';
import { GroupedExpenseRow } from '@/components/expenses/GroupedExpenseRow';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { formatDisplayDate } from '@/lib/dateUtils';

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
  notes?: string | null;
  receipt_url?: string | null;
  source?: 'manual' | 'quickbooks';
  qb_id?: string | null;
}

interface DBQuickBooksExpense {
  id: string;
  qb_id: string;
  project_id: string | null;
  category_id: string | null;
  amount: number;
  date: string;
  vendor_name: string | null;
  payment_method: string | null;
  description: string | null;
  is_imported: boolean;
  notes?: string | null;
  receipt_url?: string | null;
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
  const [selectedExpense, setSelectedExpense] = useState<DBExpense | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedExpenseGroup, setSelectedExpenseGroup] = useState<DBExpense[] | null>(null);
  const [groupDetailModalOpen, setGroupDetailModalOpen] = useState(false);
  const [expensesTableOpen, setExpensesTableOpen] = useState(true);
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

      // Collect linked QB IDs from expenses table to prevent duplicates
      const linkedQbIds = new Set(
        (expensesData || [])
          .map((e: any) => e.qb_expense_id)
          .filter(Boolean)
      );

      // Filter out QB expenses that already have a linked expenses record
      const filteredQbExpenses = (qbExpensesData || [])
        .filter((qb: DBQuickBooksExpense) => !linkedQbIds.has(qb.id));

      // Transform to match Project type
      const transformedProjects: Project[] = (projectsData || [])
        .map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          totalBudget: p.total_budget,
          startDate: p.start_date,
          status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
          projectType: (p.project_type || 'fix_flip') as 'fix_flip' | 'rental',
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

      const qbExpenses: DBExpense[] = filteredQbExpenses
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
          notes: e.notes || null,
          receipt_url: e.receipt_url || null,
          source: 'quickbooks' as const,
          qb_id: e.qb_id,
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
    return formatDisplayDate(date);
  };

  const getProjectName = useCallback((projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || projectId;
  }, [projects]);

  const getCategoryLabel = useCallback((categoryId: string, projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const category = project?.categories.find(c => c.id === categoryId);
    if (!category) return categoryId;
    return getAllCategories().find(b => b.value === category.category)?.label || category.category;
  }, [projects]);

  const handleViewReceipt = async (receiptUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const urlParts = receiptUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        // Fallback - trigger download via anchor
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
      const fileName = pathParts[pathParts.length - 1] || 'receipt';
      
      // Use Supabase SDK to download the file (bypasses ad blockers)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
      
      if (error || !data) {
        console.error('Failed to download receipt:', error);
        return;
      }
      
      // Create blob URL and trigger download
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const searchLower = search.toLowerCase().replace(/[$,]/g, ''); // Strip $ and commas for amount search
      
      // Get resolved names for searching
      const projectName = getProjectName(expense.project_id).toLowerCase();
      const categoryLabel = (expense.category_id ? getCategoryLabel(expense.category_id, expense.project_id) : '').toLowerCase();
      const amountStr = expense.amount.toString();
      
      const matchesSearch = 
        !search || // If no search, match everything
        (expense.vendor_name?.toLowerCase() || '').includes(searchLower) ||
        (expense.description?.toLowerCase() || '').includes(searchLower) ||
        (expense.notes?.toLowerCase() || '').includes(searchLower) ||
        (expense.payment_method?.toLowerCase() || '').includes(searchLower) ||
        projectName.includes(searchLower) ||
        categoryLabel.includes(searchLower) ||
        amountStr.includes(searchLower);
      
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
  }, [expenses, search, projectFilter, categoryFilter, dateRange, projects, getProjectName, getCategoryLabel]);

  // Group expenses by parent QB transaction ID (for split expenses)
  const groupedExpenses = useMemo(() => {
    const groups: Map<string, typeof filteredExpenses> = new Map();
    
    filteredExpenses.forEach((expense) => {
      // For QB expenses, check qb_id for split pattern
      // For manual expenses, use id as the group key
      let parentId = expense.id;
      
      if (expense.source === 'quickbooks' && expense.qb_id) {
        const splitMatch = expense.qb_id.match(/^(.+?)_split_/);
        if (splitMatch) {
          parentId = splitMatch[1]; // e.g., "purchase_801"
        } else {
          parentId = expense.qb_id; // Use qb_id as the key for consistency
        }
      }
      
      if (!groups.has(parentId)) {
        groups.set(parentId, []);
      }
      groups.get(parentId)!.push(expense);
    });
    
    // Filter out parent records when splits exist (prevents double-counting legacy data)
    const filteredGroups = Array.from(groups.entries()).map(([parentId, groupExpenses]) => {
      if (groupExpenses.length > 1) {
        // Multiple expenses in group - filter out any that don't have _split_ in qb_id
        // (these would be duplicate parent records from legacy imports)
        const splitOnly = groupExpenses.filter(e => 
          !e.qb_id || e.qb_id.includes('_split_')
        );
        return splitOnly.length > 0 ? splitOnly : groupExpenses;
      }
      return groupExpenses;
    });
    
    // Convert to array and sort by first expense date
    return filteredGroups.sort((a, b) => {
      return new Date(b[0].date).getTime() - new Date(a[0].date).getTime();
    });
  }, [filteredExpenses]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const hasActiveFilters = search || projectFilter !== 'all' || categoryFilter !== 'all' || dateRange;

  const resetFilters = () => {
    setSearch('');
    setProjectFilter('all');
    setCategoryFilter('all');
    setDateRange(undefined);
  };

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

        {/* QuickBooks Integration */}
        <QuickBooksIntegration projects={projects} onExpenseImported={fetchData} />

        {/* Expenses Table */}
        <Collapsible open={expensesTableOpen} onOpenChange={setExpensesTableOpen}>
          <div className="glass-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border/30">
              {/* Toggle */}
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer hover:text-foreground/80 transition-colors">
                  <ChevronDown className={`h-4 w-4 transition-transform ${expensesTableOpen ? '' : '-rotate-90'}`} />
                </div>
              </CollapsibleTrigger>
              
              {/* Filters - prevent toggle on click */}
              <div className="flex flex-wrap items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                <div className="relative min-w-[180px] max-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[140px] h-9">
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
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="all">All Categories</SelectItem>
                    {getBudgetCategories().map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9">
                      <Calendar className="h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <span>{format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}</span>
                        ) : (
                          <span>{format(dateRange.from, 'MMM d')}</span>
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
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="h-9 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              
              {/* Summary */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                <span>{filteredExpenses.length} expenses</span>
                <span>•</span>
                <span className="font-mono font-medium">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
            
            <CollapsibleContent>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="bg-muted/30">
                      <th>Date</th>
                      <th>Vendor</th>
                      <th className="!text-center">Project</th>
                      <th className="!text-center">Category</th>
                      <th className="!text-center">Payment</th>
                      <th className="!text-center">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedExpenses.map((expenseGroup) => (
                      <GroupedExpenseRow
                        key={expenseGroup[0].id}
                        expenses={expenseGroup}
                        getProjectName={getProjectName}
                        getCategoryLabel={getCategoryLabel}
                        formatCurrency={formatCurrency}
                        handleViewReceipt={handleViewReceipt}
                        onExpenseClick={(expense) => {
                          setSelectedExpense(expense);
                          setDetailModalOpen(true);
                        }}
                        onGroupClick={(expenses) => {
                          setSelectedExpenseGroup(expenses);
                          setGroupDetailModalOpen(true);
                        }}
                      />
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      <QuickExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        projects={projects}
        onExpenseCreated={fetchData}
      />

      <ExpenseDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        expense={selectedExpense}
        projectName={selectedExpense ? getProjectName(selectedExpense.project_id) : ''}
        categoryLabel={selectedExpense ? getCategoryLabel(selectedExpense.category_id, selectedExpense.project_id) : ''}
        categories={selectedExpense ? projects.find(p => p.id === selectedExpense.project_id)?.categories?.map(c => ({ id: c.id, category: c.category })) : undefined}
        onExpenseUpdated={fetchData}
      />

      <GroupedExpenseDetailModal
        open={groupDetailModalOpen}
        onOpenChange={setGroupDetailModalOpen}
        expenses={selectedExpenseGroup || []}
        projectName={selectedExpenseGroup?.[0] ? getProjectName(selectedExpenseGroup[0].project_id) : ''}
        getCategoryLabel={getCategoryLabel}
        onExpenseUpdated={fetchData}
      />
    </MainLayout>
  );
}

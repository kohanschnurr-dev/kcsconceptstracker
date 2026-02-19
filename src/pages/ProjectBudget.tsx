import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Upload,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Calendar,
  CreditCard,
  FileText,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
  Loader2,
  ArrowUpDown,
  X,
  Pencil,
  Trash2,
  MoreHorizontal,
  Settings2,
  ShoppingCart,
  Paperclip,
  Landmark,
  Home,
  Hammer,
  Calculator
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EditExpenseModal, DeleteExpenseDialog } from '@/components/project/ExpenseActions';
import { CategoryBudgetModal, DeleteCategoryDialog } from '@/components/project/CategoryBudgetModal';
import { ImportExpensesModal } from '@/components/project/ImportExpensesModal';
import { ExpenseDetailModal } from '@/components/ExpenseDetailModal';
import { ProcurementTab } from '@/components/project/ProcurementTab';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatDisplayDate } from '@/lib/dateUtils';
import { PendingBudgetBanner } from '@/components/project/PendingBudgetBanner';

const CHART_COLORS = [
  'hsl(32, 95%, 55%)',   // primary orange
  'hsl(142, 76%, 36%)',  // success green
  'hsl(200, 80%, 50%)',  // blue
  'hsl(270, 60%, 55%)',  // purple
  'hsl(0, 72%, 51%)',    // red
  'hsl(45, 93%, 47%)',   // warning yellow
  'hsl(180, 70%, 45%)',  // teal
  'hsl(320, 70%, 50%)',  // pink
];

interface DBProject {
  id: string;
  name: string;
  address: string;
  status: string;
  total_budget: number;
  start_date: string;
  purchase_price?: number;
  arv?: number;
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
  vendor_name: string | null;
  description: string | null;
  amount: number;
  date: string;
  payment_method: string | null;
  includes_tax: boolean;
  tax_amount: number | null;
  status: string;
  expense_type?: string | null;
  cost_type?: string;
  isQuickBooks?: boolean;
  notes?: string | null;
  receipt_url?: string | null;
  qb_id?: string;
}

type SortField = 'date' | 'amount' | 'vendor' | 'category';
type SortOrder = 'asc' | 'desc';

export default function ProjectBudget() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read tab from URL, default to 'budget'
  const currentTab = searchParams.get('tab') || 'budget';
  const setCurrentTab = (tab: string) => {
    if (tab === 'budget') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };
  const [project, setProject] = useState<DBProject | null>(null);
  const [categories, setCategories] = useState<(DBCategory & { actualSpent: number })[]>([]);
  const [expenses, setExpenses] = useState<DBExpense[]>([]);
  const [loading, setLoading] = useState(true);
  
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedCostType, setSelectedCostType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d' | 'year'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  
  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categorySectionOpen, setCategorySectionOpen] = useState(false);
  
  // Edit/Delete modals
  const [editingExpense, setEditingExpense] = useState<DBExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<DBExpense | null>(null);
  const [openCostTypeId, setOpenCostTypeId] = useState<string | null>(null);
  
  // Category modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<(DBCategory & { actualSpent: number }) | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<(DBCategory & { actualSpent: number }) | null>(null);
  
  // Detail modal state
  const [selectedExpense, setSelectedExpense] = useState<DBExpense | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  
  // All Expenses collapsed state - show only 7 by default
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const VISIBLE_EXPENSE_COUNT = 7;

  // Show/hide $0 categories
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Budget quick-edit state
  const [budgetEditMode, setBudgetEditMode] = useState(false);
  const [budgetEditValue, setBudgetEditValue] = useState('');

  // Ref for scrolling to expenses table
  const expensesTableRef = useRef<HTMLDivElement>(null);

  const handleCardFilter = (costType: string) => {
    setSelectedCostType(prev => prev === costType ? 'all' : costType);
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setDateRange('all');
    setTimeout(() => {
      expensesTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const fetchData = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (projectError || !projectData) {
      console.error('Error fetching project:', projectError);
      setLoading(false);
      return;
    }
    
    setProject(projectData);
    
    const [categoriesRes, expensesRes, qbExpensesRes] = await Promise.all([
      supabase.from('project_categories').select('*').eq('project_id', id),
      supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('quickbooks_expenses').select('*').eq('project_id', id).eq('is_imported', true).order('date', { ascending: false }),
    ]);
    
    const categoriesData = categoriesRes.data || [];
    const expensesData = expensesRes.data || [];
    const rawQbExpensesData = qbExpensesRes.data || [];
    
    // Filter out parent QB expenses that have split children
    // This prevents double-counting when a receipt was split into multiple categories
    const splitParentIds = new Set<string>();
    rawQbExpensesData.forEach(qb => {
      if (qb.qb_id && qb.qb_id.includes('_split_')) {
        // Extract the parent ID (everything before _split_)
        const parentId = qb.qb_id.replace(/_split_.*$/, '');
        splitParentIds.add(parentId);
      }
    });
    
    // Exclude parent records that have been split
    const qbExpensesData = rawQbExpensesData.filter(qb => {
      // If this qb_id is a parent that has splits, exclude it
      if (qb.qb_id && splitParentIds.has(qb.qb_id)) {
        return false;
      }
      return true;
    });
    
    // Collect QB IDs that have already been imported as regular expenses
    const importedQbIds = new Set(
      expensesData
        .filter(e => e.qb_expense_id)
        .map(e => e.qb_expense_id)
    );

    // Filter out QB expenses that already exist as imported regular expenses
    const dedupedQbExpenses = qbExpensesData.filter(qb => !importedQbIds.has(qb.id));

    // Combine regular expenses with QB imported expenses for category calculations
    const categoriesWithSpent = categoriesData.map(cat => {
      const regularCategoryExpenses = expensesData.filter(e => e.category_id === cat.id);
      const qbCategoryExpenses = dedupedQbExpenses.filter(e => e.category_id === cat.id);
      const regularSpent = regularCategoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const qbSpent = qbCategoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return { ...cat, actualSpent: regularSpent + qbSpent };
    });
    
    // Merge expenses for display - convert QB expenses to match DBExpense format
    const qbAsExpenses: DBExpense[] = dedupedQbExpenses.map(qb => ({
      id: qb.id,
      project_id: qb.project_id || '',
      category_id: qb.category_id || '',
      vendor_name: qb.vendor_name,
      description: qb.description,
      amount: qb.amount,
      date: qb.date,
      payment_method: qb.payment_method,
      includes_tax: false,
      tax_amount: null,
      status: 'actual',
      isQuickBooks: true,
      notes: qb.notes,
      receipt_url: qb.receipt_url,
      qb_id: qb.qb_id,
      expense_type: qb.expense_type,
      cost_type: (qb as any).cost_type || 'construction',
    }));
    
    const allExpenses = [...expensesData, ...qbAsExpenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setCategories(categoriesWithSpent);
    setExpenses(allExpenses);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id, location.key]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData(true);
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [id]);

  const refreshData = () => {
    fetchData(true);
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

  const getCategoryLabel = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return 'Unknown';
    return getBudgetCategories().find(b => b.value === cat.category)?.label || cat.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategoryName = (categoryValue: string) => {
    return getBudgetCategories().find(b => b.value === categoryValue)?.label || categoryValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate budget status with color gradient based on percentage over budget
  // Green: 0% over (at or under budget)
  // Yellow: 0-10% over budget
  // Red: over 10% over budget
  const getBudgetStatus = (spent: number, budget: number) => {
    if (budget === 0) {
      return { 
        status: 'neutral', 
        intensity: 0,
        borderClass: 'border-border',
        bgClass: '',
        progressClass: '',
        textClass: 'text-muted-foreground',
        badge: null
      };
    }
    
    const overAmount = spent - budget;
    const overPercent = budget > 0 ? (overAmount / budget) * 100 : 0;
    
    if (overPercent <= 0) {
      // At or under budget - GREEN
      return {
        status: 'good',
        intensity: 1,
        borderClass: 'border-success/60',
        bgClass: 'bg-success/10',
        progressClass: '[&>div]:bg-success',
        textClass: 'text-success',
        badge: null
      };
    } else if (overPercent <= 10) {
      // 0-10% over budget - YELLOW
      return {
        status: 'warning',
        intensity: 0.7,
        borderClass: 'border-warning/50',
        bgClass: 'bg-warning/10',
        progressClass: '[&>div]:bg-warning',
        textClass: 'text-warning',
        badge: { label: `+${formatCurrency(overAmount)}`, variant: 'outline' as const, className: 'text-warning border-warning' }
      };
    } else {
      // Over 10% over budget - RED
      return {
        status: 'over',
        intensity: 1,
        borderClass: 'border-destructive/60',
        bgClass: 'bg-destructive/10',
        progressClass: '[&>div]:bg-destructive',
        textClass: 'text-destructive',
        badge: { label: `+${formatCurrency(overAmount)}`, variant: 'destructive' as const, className: '' }
      };
    }
  };

  const getPaymentIcon = (method: string | null) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'check': return <FileText className="h-4 w-4" />;
      case 'cash': return <Banknote className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.vendor_name?.toLowerCase().includes(query) ||
        exp.description?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.category_id === selectedCategory);
    }
    
    // Payment method filter
    if (selectedPaymentMethod !== 'all') {
      filtered = filtered.filter(exp => exp.payment_method === selectedPaymentMethod);
    }
    
    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(exp => new Date(exp.date) >= cutoff);
    }
    
    // Cost type filter
    if (selectedCostType !== 'all') {
      filtered = filtered.filter(exp => (exp.cost_type || 'construction') === selectedCostType);
    }
    
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = Number(a.amount) - Number(b.amount);
          break;
        case 'vendor':
          comparison = (a.vendor_name || '').localeCompare(b.vendor_name || '');
          break;
        case 'category':
          comparison = getCategoryLabel(a.category_id).localeCompare(getCategoryLabel(b.category_id));
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMethod, selectedCostType, dateRange, sortField, sortOrder, categories]);

  // Calculate total budget - manual override takes precedence
  const categoryTotal = categories.reduce((sum, cat) => sum + Number(cat.estimated_budget), 0);
  const hasManualBudget = (project?.total_budget ?? 0) > 0;
  const totalBudget = hasManualBudget ? project!.total_budget : categoryTotal;
  const totalSpent = categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const remaining = totalBudget - totalSpent;
  const loanCosts = expenses.filter(e => e.cost_type === 'loan').reduce((sum, e) => sum + Number(e.amount), 0);
  const holdingCosts = expenses.filter(e => e.cost_type === 'monthly').reduce((sum, e) => sum + Number(e.amount), 0);
  const constructionCosts = expenses.filter(e => e.cost_type === 'construction').reduce((sum, e) => sum + Number(e.amount), 0);
  const transactionCosts = expenses.filter(e => e.cost_type === 'transaction').reduce((sum, e) => sum + Number(e.amount), 0);
  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);




  // Monthly spending calculations
  const spendingAnalytics = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // This month spending
    const thisMonthSpending = expenses.reduce((sum, exp) => {
      const expDate = new Date(exp.date);
      if (expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear) {
        return sum + Number(exp.amount);
      }
      return sum;
    }, 0);
    
    // Average daily spending
    const projectStart = new Date(project?.start_date || now);
    const daysSinceStart = Math.max(1, Math.ceil((now.getTime() - projectStart.getTime()) / (24 * 60 * 60 * 1000)));
    const avgDailySpending = totalSpent / daysSinceStart;

    return {
      thisMonthSpending,
      avgDailySpending,
      daysSinceStart
    };
  }, [expenses, project, totalSpent]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setSelectedCostType('all');
    setDateRange('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedPaymentMethod !== 'all' || selectedCostType !== 'all' || dateRange !== 'all';

  const handleCostTypeChange = async (expenseId: string, costType: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    let error;
    if (expense.isQuickBooks) {
      const result = await supabase
        .from('quickbooks_expenses')
        .update({ cost_type: costType } as any)
        .eq('id', expenseId);
      error = result.error;
    } else {
      const result = await supabase
        .from('expenses')
        .update({ cost_type: costType } as any)
        .eq('id', expenseId);
      error = result.error;
    }

    if (error) {
      toast.error('Failed to update expense type');
      return;
    }
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, cost_type: costType } : e));
    toast.success('Type updated');
  };

  const getCostTypeLabel = (type: string) => {
    switch (type) {
      case 'loan': return 'Loan';
      case 'monthly': return 'Monthly';
      case 'transaction': return 'Transaction';
      default: return 'Construction';
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Category', 'Description', 'Type', 'Amount', 'Tax', 'Payment Method', 'Status'];
    const rows = filteredExpenses.map(exp => [
      formatDate(exp.date),
      exp.vendor_name || '',
      getCategoryLabel(exp.category_id),
      exp.description || '',
      getCostTypeLabel(exp.cost_type || 'construction'),
      Number(exp.amount).toFixed(2),
      exp.tax_amount ? Number(exp.tax_amount).toFixed(2) : '0.00',
      exp.payment_method || '',
      exp.status
    ]);
    
    const csvContent = [
      `Project: ${project?.name}`,
      `Export Date: ${new Date().toLocaleDateString()}`,
      `Filtered Total: ${formatCurrency(filteredTotal)}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.name.replace(/\s+/g, '_')}_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Expenses exported successfully');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading budget details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Pending Budget Banner */}
        {(project as any).pending_budget && (
          <PendingBudgetBanner
            projectId={project.id}
            pendingBudget={(project as any).pending_budget}
            existingCategories={categories}
            onResolved={refreshData}
          />
        )}
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            className="w-fit gap-2 -ml-2"
            onClick={() => navigate(`/projects/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {project.name}
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Budget & Expenses</h1>
              <p className="text-muted-foreground">{project.name} • {project.address}</p>
            </div>
            <Button onClick={() => setExpenseModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Tabs for Budget vs Procurement */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="budget" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Budget & Expenses
            </TabsTrigger>
            <TabsTrigger value="procurement" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Procurement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="space-y-6">
            {/* Summary Cards - Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={cn("glass-card cursor-pointer transition-all hover:border-primary/30", selectedCostType === 'construction' && "ring-2 ring-primary")} onClick={() => handleCardFilter('construction')}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Hammer className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Construction Costs</span>
                  </div>
                  <p className="text-xl font-bold font-mono">{formatCurrency(constructionCosts)}</p>
                </CardContent>
              </Card>

              <Card 
                className={cn("glass-card cursor-pointer transition-all hover:border-primary/30", selectedCostType === 'loan' && "ring-2 ring-primary")}
                onClick={() => handleCardFilter('loan')}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Landmark className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Loan Costs</span>
                  </div>
                  <p className="text-xl font-bold font-mono">{formatCurrency(loanCosts)}</p>
                </CardContent>
              </Card>

              <Card 
                className={cn("glass-card cursor-pointer transition-all hover:border-primary/30", selectedCostType === 'monthly' && "ring-2 ring-primary")}
                onClick={() => handleCardFilter('monthly')}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Holding Costs</span>
                  </div>
                  <p className="text-xl font-bold font-mono">{formatCurrency(holdingCosts)}</p>
                </CardContent>
              </Card>

              <Card 
                className={cn("glass-card cursor-pointer transition-all hover:border-primary/30", selectedCostType === 'transaction' && "ring-2 ring-primary")}
                onClick={() => handleCardFilter('transaction')}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Transaction Costs</span>
                  </div>
                  <p className="text-xl font-bold font-mono">{formatCurrency(transactionCosts)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards - Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    <span className="text-sm text-muted-foreground">Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold font-mono text-warning">{formatCurrency(totalSpent)}</p>
                </CardContent>
              </Card>

              <Card 
                className={cn("glass-card transition-all", !budgetEditMode && "cursor-pointer hover:border-primary/30", selectedCostType === 'construction' && "ring-2 ring-primary")}
                onClick={() => !budgetEditMode && handleCardFilter('construction')}
              >
                <CardContent className="pt-4 relative">
                  {!budgetEditMode ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBudgetEditMode(true);
                          setBudgetEditValue(String(totalBudget));
                        }}
                        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Construction Budget</span>
                      </div>
                      <p className="text-2xl font-bold font-mono">{formatCurrency(totalBudget)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hasManualBudget ? (
                          <span className="flex items-center gap-1">
                            manual override
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const { error } = await supabase
                                  .from('projects')
                                  .update({ total_budget: 0 })
                                  .eq('id', id!);
                                if (!error) {
                                  setProject(prev => prev ? { ...prev, total_budget: 0 } : prev);
                                  toast.success('Reverted to category total');
                                }
                              }}
                              className="text-primary hover:underline"
                            >
                              (revert)
                            </button>
                          </span>
                        ) : (
                          `from ${categories.length} categories`
                        )}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Edit Total Budget</span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          value={budgetEditValue}
                          onChange={(e) => setBudgetEditValue(e.target.value)}
                          className="pl-7 font-mono h-9"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setBudgetEditMode(false);
                          }}
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={async () => {
                            const val = parseFloat(budgetEditValue) || 0;
                            const { error } = await supabase
                              .from('projects')
                              .update({ total_budget: val })
                              .eq('id', id!);
                            if (error) {
                              toast.error('Failed to update budget');
                            } else {
                              setProject(prev => prev ? { ...prev, total_budget: val } : prev);
                              toast.success('Budget updated');
                              setBudgetEditMode(false);
                            }
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setBudgetEditMode(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className={cn("h-4 w-4", remaining >= 0 ? "text-success" : "text-destructive")} />
                    <span className="text-sm text-muted-foreground">Remaining Construction Budget</span>
                  </div>
                  <p className={cn("text-2xl font-bold font-mono", remaining >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(remaining)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground"># of Expenses</span>
                  </div>
                  <p className="text-2xl font-bold">{expenses.length}</p>
                </CardContent>
              </Card>
            </div>

        {/* Budget Progress */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of budget used
              </span>
              <span className="font-mono text-sm">
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
              </span>
            </div>
            <Progress 
              value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}
              className="h-3"
            />
          </CardContent>
        </Card>

        {/* Expense Breakdown Pie Chart */}
        {categories.filter(c => c.actualSpent > 0).length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Pie Chart - no labels, just the donut */}
                <div className="h-[250px] w-full lg:w-[300px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories
                          .filter(c => c.actualSpent > 0)
                          .map(cat => ({
                            name: getCategoryName(cat.category),
                            value: cat.actualSpent,
                            percent: totalSpent > 0 ? (cat.actualSpent / totalSpent) * 100 : 0
                          }))
                          .sort((a, b) => b.value - a.value)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categories
                          .filter(c => c.actualSpent > 0)
                          .sort((a, b) => b.actualSpent - a.actualSpent)
                          .map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                              stroke="transparent"
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${formatCurrency(value)} (${props.payload.percent.toFixed(1)}%)`,
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(220, 18%, 13%)',
                          border: '1px solid hsl(220, 15%, 22%)',
                          borderRadius: '8px',
                          color: '#ffffff',
                        }}
                        itemStyle={{
                          color: '#ffffff',
                        }}
                        labelStyle={{
                          color: '#ffffff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend as a scrollable list */}
                <div className="flex-1 max-h-[250px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {categories
                      .filter(c => c.actualSpent > 0)
                      .sort((a, b) => b.actualSpent - a.actualSpent)
                      .map((cat, index) => {
                        const percent = totalSpent > 0 ? (cat.actualSpent / totalSpent) * 100 : 0;
                        return (
                          <div key={cat.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div 
                              className="w-3 h-3 rounded-sm flex-shrink-0" 
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{getCategoryName(cat.category)}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-mono">{formatCurrency(cat.actualSpent)}</p>
                              <p className="text-xs text-muted-foreground">{percent.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown - Collapsible Section */}
        <Collapsible open={categorySectionOpen} onOpenChange={setCategorySectionOpen}>
          <Card className="glass-card">
            <CollapsibleTrigger asChild>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  {categorySectionOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg">Budget by Category</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {categories.length} categories
                  </Badge>
                  {(() => {
                    const hiddenCount = categories.filter(cat => cat.estimated_budget === 0 && cat.actualSpent === 0).length;
                    return hiddenCount > 0 && !showAllCategories ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowAllCategories(true); }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground hover:bg-muted/80 border border-border/50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {hiddenCount} unallocated
                      </button>
                    ) : null;
                  })()}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(null);
                    setCategoryModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {/* Needs Allocation Banner */}
                {totalBudget > 0 && categoryTotal === 0 && (
                  <div className="flex items-center justify-between gap-4 p-4 mb-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">
                          {formatCurrency(totalBudget)} needs allocation
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Assign budgets to categories using the Budget Calculator or manually edit each category.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => navigate('/calculator')}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Open Budget Calculator
                    </Button>
                  </div>
                )}
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Settings2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-2">No budget categories set up yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Add categories to track your project expenses by type</p>
                    <Button 
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryModalOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Category
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="w-[200px]">Category</TableHead>
                          <TableHead className="text-center w-[80px]">Expenses</TableHead>
                          <TableHead className="text-right w-[120px]">Spent</TableHead>
                          <TableHead className="text-right w-[120px]">Budget</TableHead>
                          <TableHead className="w-[200px]">Progress</TableHead>
                          <TableHead className="text-right w-[100px]">Remaining</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories
                          .filter(cat => showAllCategories || cat.estimated_budget > 0 || cat.actualSpent > 0)
                          .sort((a, b) => Number(b.estimated_budget) - Number(a.estimated_budget))
                          .map((cat) => {
                            const remaining = cat.estimated_budget - cat.actualSpent;
                            const percentUsed = cat.estimated_budget > 0 ? (cat.actualSpent / cat.estimated_budget) * 100 : 0;
                            const isExpanded = expandedCategories.has(cat.id);
                            const categoryExpenses = expenses.filter(e => e.category_id === cat.id);
                            const budgetStatus = getBudgetStatus(cat.actualSpent, cat.estimated_budget);
                            
                            return (
                              <>
                                <TableRow 
                                  key={cat.id} 
                                  className={cn(
                                    "group/category cursor-pointer transition-colors",
                                    budgetStatus.bgClass,
                                    isExpanded && "bg-muted/50"
                                  )}
                                  onClick={() => toggleCategory(cat.id)}
                                >
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span>{getCategoryName(cat.category)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="text-xs font-normal">
                                      {categoryExpenses.length}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className={cn("text-right font-mono", budgetStatus.textClass)}>
                                    {formatCurrency(cat.actualSpent)}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-muted-foreground">
                                    {formatCurrency(cat.estimated_budget)}
                                  </TableCell>
                                  <TableCell>
                                    <Progress 
                                      value={Math.min(percentUsed, 100)} 
                                      className={cn("h-2", budgetStatus.progressClass)}
                                    />
                                  </TableCell>
                                  <TableCell className={cn(
                                    "text-right font-mono text-sm",
                                    remaining >= 0 ? "text-muted-foreground" : "text-destructive"
                                  )}>
                                    {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7 opacity-0 group-hover/category:opacity-100 transition-opacity"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCategory(cat);
                                          setCategoryModalOpen(true);
                                        }}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit Budget
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingCategory(cat);
                                          }}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Category
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                                {isExpanded && categoryExpenses.length > 0 && (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="p-0">
                                      <div className="bg-muted/30 border-t border-b border-border/50 py-2 px-4">
                                        <div className="grid gap-2">
                                          {categoryExpenses
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((exp) => (
                                              <div key={exp.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-background/50 border border-border/30 group/expense">
                                                <div className="flex items-center gap-3">
                                                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                                                    {getPaymentIcon(exp.payment_method)}
                                                  </div>
                                                  <div>
                                                    <p className="font-medium text-sm">{exp.vendor_name || 'Unknown Vendor'}</p>
                                                    <p className="text-xs text-muted-foreground">{exp.description || 'No description'} • {formatDate(exp.date)}</p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                  <p className="font-mono font-medium text-sm">{formatCurrency(Number(exp.amount))}</p>
                                                  <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 opacity-0 group-hover/expense:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                      setSelectedExpense(exp);
                                                      setDetailModalOpen(true);
                                                    }}
                                                  >
                                                    <MoreHorizontal className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                                {isExpanded && categoryExpenses.length === 0 && (
                                  <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="p-0">
                                      <div className="bg-muted/30 border-t border-b border-border/50 py-4 px-4 text-center text-sm text-muted-foreground">
                                        No expenses in this category
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })}
                      </TableBody>
                      {(() => {
                        const hiddenCount = categories.filter(cat => cat.estimated_budget === 0 && cat.actualSpent === 0).length;
                        return showAllCategories && hiddenCount > 0 ? (
                          <TableFooter className="bg-transparent">
                            <TableRow className="hover:bg-transparent border-t border-dashed border-border/50">
                              <TableCell colSpan={7} className="text-center py-2 bg-muted/20">
                                <button
                                  onClick={() => setShowAllCategories(false)}
                                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  Hide unallocated categories
                                </button>
                              </TableCell>
                            </TableRow>
                          </TableFooter>
                        ) : null;
                      })()}
                    </Table>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* All Expenses with Filters */}
        <Card className="glass-card" ref={expensesTableRef}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg">All Expenses</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search vendor or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {[...categories].sort((a, b) => getCategoryName(a.category).localeCompare(getCategoryName(b.category))).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getCategoryName(cat.category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="financed">Financed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCostType} onValueChange={setSelectedCostType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="transaction">Transaction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
              <span>
                Showing <span className="font-medium text-foreground">
                  {showAllExpenses ? filteredExpenses.length : Math.min(VISIBLE_EXPENSE_COUNT, filteredExpenses.length)}
                </span> of {filteredExpenses.length} expenses
                {filteredExpenses.length !== expenses.length && ` (filtered from ${expenses.length})`}
              </span>
              <span className="font-mono font-medium text-foreground">
                Total: {formatCurrency(filteredTotal)}
              </span>
            </div>

            {/* Expenses Table */}
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortField === 'date' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('vendor')}
                    >
                      <div className="flex items-center gap-1">
                        Vendor
                        {sortField === 'vendor' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 hidden md:table-cell"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        {sortField === 'category' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount
                        {sortField === 'amount' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        {expenses.length === 0 ? (
                          <div className="flex flex-col items-center gap-2">
                            <Receipt className="h-8 w-8 opacity-50" />
                            <p>No expenses recorded yet</p>
                            <Button size="sm" variant="outline" onClick={() => navigate('/expenses')}>
                              Add First Expense
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 opacity-50" />
                            <p>No expenses match your filters</p>
                            <Button size="sm" variant="ghost" onClick={clearFilters}>
                              Clear Filters
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (showAllExpenses ? filteredExpenses : filteredExpenses.slice(0, VISIBLE_EXPENSE_COUNT)).map((exp) => (
                      <TableRow 
                        key={exp.id} 
                        className="hover:bg-muted/50 group cursor-pointer"
                        onClick={() => {
                          setSelectedExpense(exp);
                          setDetailModalOpen(true);
                        }}
                      >
                        <TableCell className="text-sm">{formatDate(exp.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm truncate max-w-[150px]">
                            {exp.vendor_name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs font-normal">
                            {getCategoryLabel(exp.category_id)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                            {exp.description || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                          <Popover open={openCostTypeId === exp.id} onOpenChange={(open) => setOpenCostTypeId(open ? exp.id : null)}>
                            <PopoverTrigger asChild>
                              <button type="button" className="cursor-pointer">
                                <Badge variant="outline" className="text-xs font-normal hover:bg-accent transition-colors">
                                  {getCostTypeLabel(exp.cost_type || 'construction')}
                                </Badge>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1" align="start">
                              <div className="flex flex-col gap-0.5">
                                {['construction', 'loan', 'monthly', 'transaction'].map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    className={`text-xs px-3 py-1.5 rounded text-left hover:bg-accent transition-colors ${(exp.cost_type || 'construction') === type ? 'bg-accent font-medium' : ''}`}
                                    onClick={() => { handleCostTypeChange(exp.id, type); setOpenCostTypeId(null); }}
                                  >
                                    {getCostTypeLabel(type)}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {exp.receipt_url && (
                              <Paperclip className="h-4 w-4 text-primary" />
                            )}
                            <span className="font-mono font-medium">{formatCurrency(Number(exp.amount))}</span>
                          </div>
                          {exp.tax_amount && Number(exp.tax_amount) > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              +{formatCurrency(Number(exp.tax_amount))} tax
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <div className="flex items-center justify-center text-muted-foreground" title={exp.payment_method || 'Unknown'}>
                            {getPaymentIcon(exp.payment_method)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExpense(exp);
                              setDetailModalOpen(true);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Show More/Less Button */}
              {filteredExpenses.length > VISIBLE_EXPENSE_COUNT && (
                <div className="flex justify-center py-3 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllExpenses(!showAllExpenses)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showAllExpenses ? (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1 rotate-180" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show {filteredExpenses.length - VISIBLE_EXPENSE_COUNT} More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="procurement">
            <ProcurementTab 
              projectId={id || ''} 
              categories={categories}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        expense={editingExpense}
        categories={categories}
        open={editingExpense !== null}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        onExpenseUpdated={refreshData}
      />

      {/* Delete Expense Dialog */}
      <DeleteExpenseDialog
        expense={deletingExpense}
        open={deletingExpense !== null}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        onExpenseDeleted={refreshData}
      />

      {/* Category Budget Modal */}
      <CategoryBudgetModal
        projectId={id || ''}
        existingCategories={categories}
        editingCategory={editingCategory}
        open={categoryModalOpen}
        onOpenChange={(open) => {
          setCategoryModalOpen(open);
          if (!open) setEditingCategory(null);
        }}
        onCategoryUpdated={refreshData}
      />

      {/* Delete Category Dialog */}
      <DeleteCategoryDialog
        category={deletingCategory}
        open={deletingCategory !== null}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        onCategoryDeleted={refreshData}
      />

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        expense={selectedExpense ? {
          ...selectedExpense,
          receipt_url: selectedExpense.receipt_url || null,
          notes: selectedExpense.notes || null,
          source: selectedExpense.isQuickBooks ? 'quickbooks' : 'manual',
          qb_id: selectedExpense.qb_id,
        } : null}
        projectName={project?.name || ''}
        categoryLabel={selectedExpense ? getCategoryLabel(selectedExpense.category_id) : ''}
        categories={categories}
        onExpenseUpdated={refreshData}
      />

      <ImportExpensesModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        projectId={id!}
        existingCategories={categories}
        onImportComplete={refreshData}
      />

      <QuickExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        projects={project ? [{ id: project.id, name: project.name, address: project.address, totalBudget: project.total_budget, startDate: project.start_date, status: project.status === 'on_hold' ? 'on-hold' : project.status as 'active' | 'complete', projectType: 'fix_flip', categories: [] }] : []}
        onExpenseCreated={refreshData}
      />
    </MainLayout>
  );
}

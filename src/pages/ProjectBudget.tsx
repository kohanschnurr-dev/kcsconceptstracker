import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
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
  Settings2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BUDGET_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EditExpenseModal, DeleteExpenseDialog } from '@/components/project/ExpenseActions';
import { CategoryBudgetModal, DeleteCategoryDialog } from '@/components/project/CategoryBudgetModal';

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
}

type SortField = 'date' | 'amount' | 'vendor' | 'category';
type SortOrder = 'asc' | 'desc';

export default function ProjectBudget() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<DBProject | null>(null);
  const [categories, setCategories] = useState<(DBCategory & { actualSpent: number })[]>([]);
  const [expenses, setExpenses] = useState<DBExpense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d' | 'year'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Edit/Delete modals
  const [editingExpense, setEditingExpense] = useState<DBExpense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<DBExpense | null>(null);
  
  // Category modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<(DBCategory & { actualSpent: number }) | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<(DBCategory & { actualSpent: number }) | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    
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
    
    const [categoriesRes, expensesRes] = await Promise.all([
      supabase.from('project_categories').select('*').eq('project_id', id),
      supabase.from('expenses').select('*').eq('project_id', id).order('date', { ascending: false })
    ]);
    
    const categoriesData = categoriesRes.data || [];
    const expensesData = expensesRes.data || [];
    
    const categoriesWithSpent = categoriesData.map(cat => {
      const categoryExpenses = expensesData.filter(e => e.category_id === cat.id);
      const actualSpent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return { ...cat, actualSpent };
    });
    
    setCategories(categoriesWithSpent);
    setExpenses(expensesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const refreshData = () => {
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return 'Unknown';
    return BUDGET_CATEGORIES.find(b => b.value === cat.category)?.label || cat.category;
  };

  const getCategoryName = (categoryValue: string) => {
    return BUDGET_CATEGORIES.find(b => b.value === categoryValue)?.label || categoryValue;
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
  }, [expenses, searchQuery, selectedCategory, selectedPaymentMethod, dateRange, sortField, sortOrder, categories]);

  const totalSpent = categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const remaining = project ? project.total_budget - totalSpent : 0;
  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

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
    setDateRange('all');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedPaymentMethod !== 'all' || dateRange !== 'all';

  const exportToCSV = () => {
    const headers = ['Date', 'Vendor', 'Category', 'Description', 'Amount', 'Tax', 'Payment Method', 'Status'];
    const rows = filteredExpenses.map(exp => [
      formatDate(exp.date),
      exp.vendor_name || '',
      getCategoryLabel(exp.category_id),
      exp.description || '',
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => navigate(`/expenses`)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Budget</span>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(project.total_budget)}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-warning" />
                <span className="text-sm text-muted-foreground">Total Spent</span>
              </div>
              <p className="text-2xl font-bold font-mono text-warning">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className={cn("h-4 w-4", remaining >= 0 ? "text-success" : "text-destructive")} />
                <span className="text-sm text-muted-foreground">Remaining</span>
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
                <span className="text-sm text-muted-foreground">Expenses</span>
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
                {((totalSpent / project.total_budget) * 100).toFixed(1)}% of budget used
              </span>
              <span className="font-mono text-sm">
                {formatCurrency(totalSpent)} / {formatCurrency(project.total_budget)}
              </span>
            </div>
            <Progress 
              value={Math.min((totalSpent / project.total_budget) * 100, 100)} 
              className="h-3"
            />
          </CardContent>
        </Card>

        {/* Category Breakdown - Expandable */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg">Budget by Category</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
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
              categories
                .sort((a, b) => b.actualSpent - a.actualSpent)
                .map((cat) => {
                  const remaining = cat.estimated_budget - cat.actualSpent;
                  const percentUsed = cat.estimated_budget > 0 ? (cat.actualSpent / cat.estimated_budget) * 100 : 0;
                  const isExpanded = expandedCategories.has(cat.id);
                  const categoryExpenses = expenses.filter(e => e.category_id === cat.id);
                  
                  return (
                    <Collapsible key={cat.id} open={isExpanded} onOpenChange={() => toggleCategory(cat.id)}>
                      <div 
                        className={cn(
                          "p-4 rounded-lg border transition-all hover:bg-muted/50 group/category",
                          remaining < 0 && "border-destructive/50 bg-destructive/5",
                          remaining >= 0 && percentUsed >= 80 && "border-warning/50 bg-warning/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-2 cursor-pointer flex-1">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">{getCategoryName(cat.category)}</span>
                              <Badge variant="outline" className="text-xs">
                                {categoryExpenses.length} expenses
                              </Badge>
                              {remaining < 0 && (
                                <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                              )}
                              {remaining >= 0 && percentUsed >= 80 && (
                                <Badge variant="outline" className="text-xs text-warning border-warning">At Risk</Badge>
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-mono font-semibold">{formatCurrency(cat.actualSpent)}</p>
                              <p className="text-xs text-muted-foreground">of {formatCurrency(cat.estimated_budget)}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover/category:opacity-100 transition-opacity"
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(percentUsed, 100)} 
                            className={cn(
                              "h-2 flex-1",
                              remaining < 0 && "[&>div]:bg-destructive",
                              remaining >= 0 && percentUsed >= 80 && "[&>div]:bg-warning"
                            )}
                          />
                          <span className="text-xs text-muted-foreground w-16 text-right">
                            {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`} left
                          </span>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="mt-2 ml-6 border-l-2 border-muted pl-4 space-y-2">
                          {categoryExpenses.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No expenses in this category</p>
                          ) : (
                            categoryExpenses
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((exp) => (
                                <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border group/expense">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                      {getPaymentIcon(exp.payment_method)}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{exp.vendor_name || 'Unknown Vendor'}</p>
                                      <p className="text-xs text-muted-foreground">{exp.description || 'No description'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="font-mono font-medium">{formatCurrency(Number(exp.amount))}</p>
                                      <p className="text-xs text-muted-foreground">{formatDate(exp.date)}</p>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-7 w-7 opacity-0 group-hover/expense:opacity-100 transition-opacity"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingExpense(exp)}>
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => setDeletingExpense(exp)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
            )}
          </CardContent>
        </Card>

        {/* All Expenses with Filters */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg">All Expenses</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                  {categories.map((cat) => (
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
            </div>

            {/* Results summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
              <span>
                Showing <span className="font-medium text-foreground">{filteredExpenses.length}</span> of {expenses.length} expenses
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
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                    filteredExpenses.map((exp) => (
                      <TableRow key={exp.id} className="hover:bg-muted/50 group">
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
                        <TableCell className="text-right">
                          <span className="font-mono font-medium">{formatCurrency(Number(exp.amount))}</span>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingExpense(exp)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingExpense(exp)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
    </MainLayout>
  );
}

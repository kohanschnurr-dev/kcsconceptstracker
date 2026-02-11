import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Search, Download, Receipt, Calendar, Briefcase, Upload, FileText, X, Paperclip, Save, RotateCcw, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { MainLayout } from '@/components/layout/MainLayout';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getBusinessExpenseCategories, TEXAS_SALES_TAX } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { BusinessQuickBooksIntegration } from '@/components/BusinessQuickBooksIntegration';
 import { CompactDashboardWidgets } from '@/components/ops/CompactDashboardWidgets';
import { BusinessExpenseDetailModal } from '@/components/BusinessExpenseDetailModal';

import { formatDisplayDate, formatDateString } from '@/lib/dateUtils';
import { useCompanySettings } from '@/hooks/useCompanySettings';
const BACKUP_KEY = 'dfw_project_expenses_backup';

interface DBBusinessExpense {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  category: string;
  vendor_name: string | null;
  description: string | null;
  payment_method: 'cash' | 'check' | 'card' | 'transfer' | null;
  includes_tax: boolean;
  tax_amount: number | null;
  notes: string | null;
  receipt_url: string | null;
}

export default function BusinessExpenses() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenses, setExpenses] = useState<DBBusinessExpense[]>([]);
  const [projects, setProjects] = useState<{id: string; name: string; address?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState<DBBusinessExpense | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupData, setBackupData] = useState<DBBusinessExpense[] | null>(null);
  const [expensesTableOpen, setExpensesTableOpen] = useState(true);
  const { toast } = useToast();
  const { companyName } = useCompanySettings();
   const [goals, setGoals] = useState<{id: string; title: string; target_value: number; current_value: number | null; category: string | null; start_date: string | null; due_date: string | null; completed_at: string | null}[]>([]);
   const [rules, setRules] = useState<{id: string; title: string; category: string | null; is_completed: boolean | null}[]>([]);
  // Form state for new expense
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    vendorName: '',
    description: '',
    paymentMethod: 'card' as 'cash' | 'check' | 'card' | 'transfer',
    date: formatDateString(new Date()),
    includesTax: false,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasCheckedBackup = useRef(false);

  // Check for backup on mount
  useEffect(() => {
    if (hasCheckedBackup.current) return;
    hasCheckedBackup.current = true;
    
    const stored = localStorage.getItem(BACKUP_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBackupData(parsed);
        }
      } catch (e) {
        console.error('Error parsing backup:', e);
      }
    }
  }, []);

  // Show restore dialog after loading if we have backup but empty expenses
  useEffect(() => {
    if (!isLoading && expenses.length === 0 && backupData && backupData.length > 0) {
      setShowRestoreDialog(true);
    }
  }, [isLoading, expenses.length, backupData]);

  // Autosave to localStorage when expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(expenses));
    }
  }, [expenses]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         setIsLoading(false);
         return;
       }
 
       const [expensesRes, projectsRes, goalsRes, rulesRes] = await Promise.all([
        supabase
          .from('business_expenses')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('projects')
          .select('id, name, address')
           .order('name'),
         supabase
           .from('quarterly_goals')
           .select('id, title, target_value, current_value, category, start_date, due_date, completed_at')
           .eq('user_id', user.id)
           .eq('quarter', 'Q1 2026'),
         supabase
           .from('operation_codes')
           .select('id, title, category, is_completed')
           .eq('user_id', user.id)
           .order('order_index')
      ]);

      if (expensesRes.error) throw expensesRes.error;

      setExpenses(expensesRes.data || []);
      setProjects(projectsRes.data || []);
       
       // Seed default goals if empty
       let goalsData = goalsRes.data || [];
       if (goalsData.length === 0) {
         const defaultGoals = [
           { user_id: user.id, title: 'Generate $50K profit', target_value: 50000, current_value: 0, category: 'financial', quarter: 'Q1 2026' },
           { user_id: user.id, title: 'Close 3 Flips', target_value: 3, current_value: 0, category: 'task_completion', quarter: 'Q1 2026' },
           { user_id: user.id, title: 'Underwrite 10 Deals', target_value: 10, current_value: 0, category: 'task_completion', quarter: 'Q1 2026' },
         ];
         const { data: insertedGoals } = await supabase.from('quarterly_goals').insert(defaultGoals).select();
         goalsData = insertedGoals || [];
       }
       setGoals(goalsData);
       
       // Seed default rules if empty
       let rulesData = rulesRes.data || [];
       if (rulesData.length === 0) {
         const defaultRules = [
           { user_id: user.id, title: 'Foundation First', category: 'order_of_operations', order_index: 1, is_completed: false },
           { user_id: user.id, title: 'Structural Complete Before Finish', category: 'order_of_operations', order_index: 2, is_completed: false },
           { user_id: user.id, title: 'Pre-Sheetrock HVAC Inspection', category: 'order_of_operations', order_index: 3, is_completed: false },
           { user_id: user.id, title: 'Electrical Before Drywall', category: 'order_of_operations', order_index: 4, is_completed: false },
           { user_id: user.id, title: 'Must Have Insurance', category: 'vendor_requirements', order_index: 5, is_completed: false },
           { user_id: user.id, title: 'COI Required', category: 'vendor_requirements', order_index: 6, is_completed: false },
         ];
         const { data: insertedRules } = await supabase.from('operation_codes').insert(defaultRules).select();
         rulesData = insertedRules || [];
       }
       setRules(rulesData);
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

  const uploadReceipt = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('expense-receipts')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('expense-receipts').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, WebP, or PDF file',
        variant: 'destructive',
      });
      return;
    }
    setReceiptFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in amount and category',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const amount = parseFloat(formData.amount);
      const taxAmount = formData.includesTax ? amount * TEXAS_SALES_TAX : null;

      let receiptUrl: string | null = null;
      if (receiptFile) {
        setIsUploading(true);
        receiptUrl = await uploadReceipt(receiptFile, user.id);
        setIsUploading(false);
        if (!receiptUrl) {
          toast({
            title: 'Upload failed',
            description: 'Could not upload receipt, but expense will still be saved',
            variant: 'destructive',
          });
        }
      }

      const { error } = await supabase
        .from('business_expenses')
        .insert({
          user_id: user.id,
          amount,
          category: formData.category,
          vendor_name: formData.vendorName || null,
          description: formData.description || null,
          payment_method: formData.paymentMethod,
          date: formData.date,
          includes_tax: formData.includesTax,
          tax_amount: taxAmount,
          notes: formData.notes || null,
          receipt_url: receiptUrl,
        });

      if (error) throw error;

      toast({
        title: 'Expense added',
        description: 'Business expense recorded successfully',
      });

      setFormData({
        amount: '',
        category: '',
        vendorName: '',
        description: '',
        paymentMethod: 'card',
        date: formatDateString(new Date()),
        includesTax: false,
        notes: '',
      });
      setReceiptFile(null);
      setExpenseModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add expense',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
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

  const getCategoryLabel = useCallback((category: string) => {
    return getBusinessExpenseCategories().find(b => b.value === category)?.label || 
      category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }, []);

  const handleViewReceipt = async (receiptUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const urlParts = receiptUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
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
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);
      
      if (error || !data) {
        console.error('Failed to download receipt:', error);
        return;
      }
      
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const searchLower = search.toLowerCase().replace(/[$,]/g, '');
      const categoryLabel = getCategoryLabel(expense.category).toLowerCase();
      const amountStr = expense.amount.toString();
      
      const matchesSearch = 
        !search ||
        (expense.vendor_name?.toLowerCase() || '').includes(searchLower) ||
        (expense.description?.toLowerCase() || '').includes(searchLower) ||
        (expense.notes?.toLowerCase() || '').includes(searchLower) ||
        (expense.payment_method?.toLowerCase() || '').includes(searchLower) ||
        categoryLabel.includes(searchLower) ||
        amountStr.includes(searchLower);
      
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;

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
  }, [expenses, search, categoryFilter, dateRange, getCategoryLabel]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const hasActiveFilters = search || categoryFilter !== 'all' || dateRange;

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setDateRange(undefined);
  };
  const sanitizeForCSV = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .replace(/"/g, '""') // Escape quotes by doubling them
      .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
      .replace(/,/g, ';'); // Replace commas with semicolons
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Vendor', 'Amount', 'Tax', 'Notes'];
    const rows = filteredExpenses.map(e => [
      e.date,
      sanitizeForCSV(getCategoryLabel(e.category)),
      sanitizeForCSV(e.vendor_name),
      e.amount.toFixed(2), // Plain number for Excel compatibility
      (e.tax_amount || 0).toFixed(2),
      sanitizeForCSV(e.notes || e.description)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `business-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast({
      title: 'Export complete',
      description: `${filteredExpenses.length} expenses exported to CSV`,
    });
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(expenses, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `business-expenses-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    link.click();
    
    toast({
      title: 'Backup created',
      description: `${expenses.length} expenses saved to JSON file`,
    });
  };

  const handleRestoreBackup = async () => {
    if (!backupData) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert backup data into database
      for (const expense of backupData) {
        await supabase.from('business_expenses').upsert({
          ...expense,
          user_id: user.id,
        }, { onConflict: 'id' });
      }

      toast({
        title: 'Backup restored',
        description: `${backupData.length} expenses restored from backup`,
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Restore failed',
        description: error.message || 'Could not restore backup',
        variant: 'destructive',
      });
    } finally {
      setShowRestoreDialog(false);
      setBackupData(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{companyName}</h1>
            <p className="text-muted-foreground mt-1">Track business expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToJSON}>
                  <Save className="h-4 w-4 mr-2" />
                  Manual Backup (JSON)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2" onClick={() => setExpenseModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* QuickBooks Integration */}
        <BusinessQuickBooksIntegration onExpenseImported={fetchData} projects={projects} />


         {/* Compact Command Center Widgets */}
         <CompactDashboardWidgets 
           expenses={expenses}
           goals={goals.filter(g => !g.completed_at)}
           rules={rules}
           getCategoryLabel={getCategoryLabel}
           onCategoryClick={setCategoryFilter}
           selectedCategory={categoryFilter}
            allGoals={goals}
            onAddGoal={async (goal) => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return;
             const { data } = await supabase.from('quarterly_goals').insert({
               user_id: user.id,
               title: goal.title,
               target_value: goal.target_value,
               category: goal.category,
               quarter: 'Q1 2026',
               current_value: 0,
               start_date: goal.start_date || null,
               due_date: goal.due_date || null,
             }).select().single();
             if (data) setGoals(prev => [...prev, data]);
            }}
            onUpdateGoal={async (goalId, newValue) => {
              const { error } = await supabase.from('quarterly_goals').update({ current_value: newValue }).eq('id', goalId);
              if (!error) {
                setGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_value: newValue } : g));
              }
            }}
            onCompleteGoal={async (goalId) => {
              const now = new Date().toISOString();
              const { error } = await supabase.from('quarterly_goals').update({ completed_at: now }).eq('id', goalId);
              if (!error) {
                setGoals(prev => prev.map(g => g.id === goalId ? { ...g, completed_at: now } : g));
              }
            }}
            onUncompleteGoal={async (goalId) => {
              const { error } = await supabase.from('quarterly_goals').update({ completed_at: null }).eq('id', goalId);
              if (!error) {
                setGoals(prev => prev.map(g => g.id === goalId ? { ...g, completed_at: null } : g));
              }
            }}
           onAddRule={async (rule) => {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) return;
             const { data } = await supabase.from('operation_codes').insert({
               user_id: user.id,
               title: rule.title,
               category: rule.category,
               order_index: rules.length,
               is_completed: false,
             }).select().single();
             if (data) setRules(prev => [...prev, data]);
           }}
         />

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
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getBusinessExpenseCategories().map((cat) => (
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
                      <th className="!text-center">Category</th>
                      <th className="!text-center">Payment</th>
                      <th className="!text-center">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">
                          <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p>No business expenses found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense) => (
                        <tr 
                          key={expense.id} 
                          className="hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setDetailModalOpen(true);
                          }}
                        >
                          <td className="whitespace-nowrap">{formatDate(expense.date)}</td>
                          <td>
                            <div>
                              <p className="font-medium">{expense.vendor_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {expense.description}
                              </p>
                              {expense.notes && (
                                <p className="text-xs text-muted-foreground/70 italic truncate max-w-[200px] mt-0.5">
                                  Note: {expense.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryLabel(expense.category)}
                            </Badge>
                          </td>
                          <td className="text-center capitalize">{expense.payment_method}</td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {expense.receipt_url && (
                                <button
                                  onClick={(e) => handleViewReceipt(expense.receipt_url!, e)}
                                  className="text-primary hover:text-primary/80"
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Add Expense Modal */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Add Business Expense
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {getBusinessExpenseCategories().map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input
                placeholder="Vendor name"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="What was this for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or details about this expense..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>Receipt</Label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />
              {receiptFile ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReceiptFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    isDragging 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Drag & drop or click to upload receipt
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, WebP, or PDF
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includesTax"
                checked={formData.includesTax}
                onCheckedChange={(checked) => setFormData({ ...formData, includesTax: checked as boolean })}
              />
              <Label htmlFor="includesTax" className="text-sm">
                Add TX Sales Tax (8.25%)
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setExpenseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || isUploading}>
                {isUploading ? 'Uploading...' : isSubmitting ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BusinessExpenseDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        expense={selectedExpense}
        onExpenseUpdated={fetchData}
      />

      {/* Restore Backup Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Restore Data from Backup?
            </AlertDialogTitle>
            <AlertDialogDescription>
              We found {backupData?.length || 0} expenses saved from a previous session. 
              Would you like to restore them to prevent data loss?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRestoreDialog(false);
              setBackupData(null);
            }}>
              No, start fresh
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreBackup}>
              Restore backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

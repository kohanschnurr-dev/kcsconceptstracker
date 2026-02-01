import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Search, Download, Receipt, Calendar, Briefcase, Upload, FileText, X, Paperclip, Save, RotateCcw, ChevronDown } from 'lucide-react';
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
import { BUSINESS_EXPENSE_CATEGORIES, TEXAS_SALES_TAX } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { BusinessQuickBooksIntegration } from '@/components/BusinessQuickBooksIntegration';
import { BusinessExpenseTrendChart } from '@/components/dashboard/BusinessExpenseTrendChart';
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
  const { toast } = useToast();
  const { companyName } = useCompanySettings();
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
      const [expensesRes, projectsRes] = await Promise.all([
        supabase
          .from('business_expenses')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('projects')
          .select('id, name, address')
          .order('name')
      ]);

      if (expensesRes.error) throw expensesRes.error;

      setExpenses(expensesRes.data || []);
      setProjects(projectsRes.data || []);
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

  const getCategoryLabel = (category: string) => {
    return BUSINESS_EXPENSE_CATEGORIES.find(b => b.value === category)?.label || 
      category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = 
        (expense.vendor_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (expense.description?.toLowerCase() || '').includes(search.toLowerCase());
      
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
  }, [expenses, search, categoryFilter, dateRange]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Sanitize string for CSV (remove commas, quotes, newlines)
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

        {/* Expense Trend Chart */}
        {expenses.length > 0 && (
          <BusinessExpenseTrendChart 
            expenses={expenses} 
            getCategoryLabel={getCategoryLabel} 
          />
        )}

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
            <SelectTrigger className="w-[180px]">
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

        {/* Summary */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
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
                  <th>Category</th>
                  <th>Payment</th>
                  <th className="text-right">Amount</th>
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
                      No business expenses found
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
                      <td>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </td>
                      <td className="capitalize">{expense.payment_method}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {expense.receipt_url && (
                            <Paperclip className="h-4 w-4 text-primary" />
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
        </div>
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
                  {BUSINESS_EXPENSE_CATEGORIES.map((cat) => (
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

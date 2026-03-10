import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { BudgetCategory } from '@/types';

// Helper to normalize payment method (only cash or card allowed)
const normalizePaymentMethod = (method: string | null | undefined): 'cash' | 'card' => {
  if (method === 'cash') return 'cash';
  return 'card';
};

interface QuickBooksExpense {
  id: string;
  qb_id: string;
  vendor_name: string | null;
  amount: number;
  date: string;
  description: string | null;
  payment_method: string | null;
  is_imported: boolean;
  project_id: string | null;
  category_id: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

// Sample mock data for demo mode
const MOCK_QB_EXPENSES: QuickBooksExpense[] = [
  {
    id: 'mock-qb-1',
    qb_id: 'QB-12345',
    vendor_name: 'Home Depot',
    amount: 1247.89,
    date: '2025-01-08',
    description: 'Lumber and building materials for framing',
    payment_method: 'card',
    is_imported: false,
    project_id: null,
    category_id: null,
    notes: null,
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-qb-2',
    qb_id: 'QB-12346',
    vendor_name: 'Ferguson Plumbing',
    amount: 3420.00,
    date: '2025-01-07',
    description: 'Water heater and supply lines',
    payment_method: 'check',
    is_imported: false,
    project_id: null,
    category_id: null,
    notes: null,
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-qb-3',
    qb_id: 'QB-12347',
    vendor_name: 'Lowes',
    amount: 892.45,
    date: '2025-01-06',
    description: 'Electrical panels and wiring supplies',
    payment_method: 'card',
    is_imported: false,
    project_id: null,
    category_id: null,
    notes: null,
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-qb-4',
    qb_id: 'QB-12348',
    vendor_name: 'ABC Roofing Supply',
    amount: 5680.00,
    date: '2025-01-05',
    description: '30-year architectural shingles - full roof',
    payment_method: 'transfer',
    is_imported: false,
    project_id: null,
    category_id: null,
    notes: null,
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-qb-5',
    qb_id: 'QB-12349',
    vendor_name: 'Texas HVAC Wholesale',
    amount: 4250.00,
    date: '2025-01-04',
    description: '3-ton AC unit with install kit',
    payment_method: 'check',
    is_imported: false,
    project_id: null,
    category_id: null,
    notes: null,
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-qb-6',
    qb_id: 'QB-12350',
    vendor_name: 'Cabinet Depot',
    amount: 8900.00,
    date: '2025-01-03',
    description: 'Kitchen cabinet set - shaker style white',
    payment_method: 'card',
    is_imported: false,
    project_id: null,
    category_id: null,
    notes: null,
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-qb-7',
    qb_id: 'QB-12351',
    vendor_name: 'Floor & Decor',
    amount: 2156.78,
    date: '2025-01-02',
    description: 'LVP flooring - 1200 sq ft',
    payment_method: 'card',
    is_imported: false,
    project_id: null,
    category_id: null,
    notes: null,
    receipt_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const LAST_SYNC_KEY = 'quickbooks_last_sync';
const AUTO_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export function useQuickBooks() {
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<QuickBooksExpense[]>([]);
  const [hasAutoSynced, setHasAutoSynced] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { action: 'status' },
      });
      
      if (error) {
        console.error('Error checking QuickBooks status:', error);
        setIsConnected(false);
      } else {
        setIsConnected(data?.connected || false);
      }
    } catch (error) {
      console.error('Error checking QuickBooks connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setIsConnected(true);
    setPendingExpenses([...MOCK_QB_EXPENSES]);
    toast({
      title: 'Demo Mode Enabled',
      description: 'Using sample QuickBooks data for testing',
    });
  }, [toast]);

  const connect = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { action: 'authorize' },
      });
      
      if (error) {
        toast({
          title: 'Connection Failed',
          description: 'Failed to initiate QuickBooks connection',
          variant: 'destructive',
        });
        return;
      }

      if (data?.authUrl) {
        // Open QuickBooks auth in a popup
        const popup = window.open(data.authUrl, 'quickbooks-auth', 'width=600,height=700');
        
        // Listen for the callback
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'quickbooks-connected') {
            popup?.close();
            window.removeEventListener('message', handleMessage);
            
            if (event.data.success) {
              setIsConnected(true);
              toast({
                title: 'Connected!',
                description: 'QuickBooks connected successfully',
              });
            } else {
              toast({
                title: 'Connection Failed',
                description: event.data.error || 'Failed to connect to QuickBooks',
                variant: 'destructive',
              });
            }
          }
        };
        
        window.addEventListener('message', handleMessage);
      }
    } catch (error) {
      console.error('Error connecting to QuickBooks:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to QuickBooks',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setIsConnected(false);
      setPendingExpenses([]);
      toast({
        title: 'Demo Mode Disabled',
        description: 'Sample data cleared',
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { action: 'disconnect' },
      });
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to disconnect QuickBooks',
          variant: 'destructive',
        });
        return;
      }

      setIsConnected(false);
      setPendingExpenses([]);
      toast({
        title: 'Disconnected',
        description: 'QuickBooks disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting QuickBooks:', error);
    }
  }, [toast, isDemoMode]);

  const fetchPendingExpenses = useCallback(async () => {
    if (isDemoMode) {
      return; // Mock data already set
    }

    try {
      const { data, error } = await supabase
        .from('quickbooks_expenses')
        .select('*')
        .eq('is_imported', false)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching pending expenses:', error);
        return;
      }

      setPendingExpenses(data || []);
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
    }
  }, [isDemoMode]);

  const syncExpenses = useCallback(async (startDate?: string, endDate?: string, isAutoSync = false) => {
    if (isDemoMode) {
      setIsSyncing(true);
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!isAutoSync) {
        toast({
          title: 'Demo Sync Complete',
          description: `${MOCK_QB_EXPENSES.length} sample expenses available`,
        });
      }
      // Update last sync time
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
        body: { startDate, endDate },
      });

      if (error) {
        if (!isAutoSync) {
          toast({
            title: 'Sync Failed',
            description: 'Failed to sync expenses from QuickBooks',
            variant: 'destructive',
          });
        }
        return;
      }

      // Update last sync time on success
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      if (!isAutoSync) {
        toast({
          title: 'Sync Complete',
          description: data?.message || 'Expenses synced successfully',
        });
      }

      // Fetch pending expenses
      await fetchPendingExpenses();
    } catch (error) {
      console.error('Error syncing expenses:', error);
      if (!isAutoSync) {
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync expenses from QuickBooks',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [toast, isDemoMode, fetchPendingExpenses]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    if (isDemoMode) {
      setPendingExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast({
        title: 'Removed',
        description: 'Expense removed from list',
      });
      return true;
    }

    try {
      const { error } = await supabase
        .from('quickbooks_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete expense',
          variant: 'destructive',
        });
        return false;
      }

      setPendingExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast({
        title: 'Removed',
        description: 'Expense deleted successfully',
      });
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }, [toast, isDemoMode]);

  const categorizeExpense = useCallback(async (
    expenseId: string,
    projectId: string,
    categoryValue: string,
    expenseType: 'product' | 'labor' = 'product',
    notes?: string,
    costType: string = 'construction'
  ) => {
    if (!categoryValue) {
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return false;
    }

    // Find or create the project_category
    let categoryId: string | null = null;
    
    if (categoryValue) {
      // Ensure the enum value exists before any DB query referencing it
      await supabase.rpc('add_budget_category', { new_value: categoryValue });

      // Check if category already exists for this project
      const { data: existingCategory, error: findError } = await supabase
        .from('project_categories')
        .select('id')
        .eq('project_id', projectId)
        .eq('category', categoryValue as BudgetCategory)
        .maybeSingle();
      
      if (findError) {
        console.error('Error finding category:', findError);
        toast({
          title: 'Error',
          description: 'Failed to find category',
          variant: 'destructive',
        });
        return false;
      }
      
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const { data: newCategory, error: createError } = await supabase
          .from('project_categories')
          .insert({
            project_id: projectId,
            category: categoryValue as BudgetCategory,
            estimated_budget: 0,
          })
          .select('id')
          .single();
        
        if (createError || !newCategory) {
          console.error('Error creating category:', createError);
          toast({
            title: 'Error',
            description: 'Failed to create category',
            variant: 'destructive',
          });
          return false;
        }
        
        categoryId = newCategory.id;
      }
    }

    if (isDemoMode) {
      // Find the expense to get its data
      const expense = pendingExpenses.find(e => e.id === expenseId);
      if (!expense) {
        toast({
          title: 'Error',
          description: 'Expense not found',
          variant: 'destructive',
        });
        return false;
      }

      // Check for duplicate before inserting (demo mode uses qb_id as identifier)
      const { data: existingDemo } = await supabase
        .from('expenses')
        .select('id')
        .eq('qb_expense_id', expenseId)
        .maybeSingle();

      if (existingDemo) {
        toast({ title: 'Already Imported', description: 'This expense has already been imported.' });
        setPendingExpenses(prev => prev.filter(e => e.id !== expenseId));
        return true;
      }

      // Insert into the real expenses table
      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: projectId,
          category_id: categoryId,
          amount: expense.amount,
          date: expense.date,
          vendor_name: expense.vendor_name,
          description: expense.description,
          payment_method: normalizePaymentMethod(expense.payment_method),
          status: 'actual',
          includes_tax: false,
          expense_type: expenseType,
          notes: notes || null,
          cost_type: costType,
        } as any);

      if (error) {
        console.error('Error inserting expense:', error);
        toast({
          title: 'Error',
          description: 'Failed to import expense: ' + error.message,
          variant: 'destructive',
        });
        return false;
      }



      // Remove from pending in demo mode
      setPendingExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast({
        title: 'Imported!',
        description: 'Expense added to your project',
      });
      return true;
    }

    try {
      // Find the expense data before marking as imported
      const expense = pendingExpenses.find(e => e.id === expenseId);
      const { data: { user } } = await supabase.auth.getUser();

      // Insert into expenses table (mirrors demo-mode behavior)
      if (expense && user) {
        // Check for duplicate before inserting
        const { data: existingExpense } = await supabase
          .from('expenses')
          .select('id')
          .eq('qb_expense_id', expenseId)
          .maybeSingle();

        if (existingExpense) {
          toast({ title: 'Already Imported', description: 'This expense has already been imported.' });
          setPendingExpenses(prev => prev.filter(e => e.id !== expenseId));
          return true;
        }

        const { error: insertError } = await supabase.from('expenses').insert({
          project_id: projectId,
          category_id: categoryId,
          amount: expense.amount,
          date: expense.date,
          vendor_name: expense.vendor_name,
          description: expense.description,
          payment_method: normalizePaymentMethod(expense.payment_method),
          status: 'actual' as const,
          includes_tax: false,
          expense_type: expenseType,
          notes: notes || null,
          qb_expense_id: expenseId,
          cost_type: costType,
        } as any);

        if (insertError) {
          console.error('Error inserting expense:', insertError);
          toast({
            title: 'Error',
            description: 'Failed to create expense record',
            variant: 'destructive',
          });
          return false;
        }
      }

      const { error } = await supabase
        .from('quickbooks_expenses')
        .update({ 
          project_id: projectId, 
          category_id: categoryId,
          is_imported: true,
          expense_type: expenseType,
          notes: notes || null
        })
        .eq('id', expenseId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to categorize expense',
          variant: 'destructive',
        });
        return false;
      }



      // Refresh pending expenses
      await fetchPendingExpenses();
      
      toast({
        title: 'Categorized',
        description: 'Expense categorized and imported successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error categorizing expense:', error);
      return false;
    }
  }, [toast, fetchPendingExpenses, isDemoMode, pendingExpenses]);

  const splitExpense = useCallback(async (
    expenseId: string,
    splits: Array<{
      amount: number;
      projectId: string;
      categoryValue: string;
      expenseType: 'product' | 'labor';
      notes: string;
    }>
  ) => {
    const expense = pendingExpenses.find(e => e.id === expenseId);
    if (!expense) {
      toast({
        title: 'Error',
        description: 'Expense not found',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // Process each split
      for (let i = 0; i < splits.length; i++) {
        const split = splits[i];
        // Find or create the project_category
        let categoryId: string;
        
        const { data: existingCategory, error: findError } = await supabase
          .from('project_categories')
          .select('id')
          .eq('project_id', split.projectId)
          .eq('category', split.categoryValue as BudgetCategory)
          .maybeSingle();
        
        if (findError) {
          console.error('Error finding category:', findError);
          continue;
        }
        
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const { data: newCategory, error: createError } = await supabase
            .from('project_categories')
            .insert({
              project_id: split.projectId,
              category: split.categoryValue as BudgetCategory,
              estimated_budget: 0,
            })
            .select('id')
            .single();
          
          if (createError || !newCategory) {
            console.error('Error creating category:', createError);
            continue;
          }
          categoryId = newCategory.id;
        }

        // Check for duplicate split expense
        const splitQbId = `${expenseId}_split_${i}`;
        const { data: existingSplit } = await supabase
          .from('expenses')
          .select('id')
          .eq('qb_expense_id', splitQbId)
          .maybeSingle();

        if (existingSplit) {
          console.log('Skipping duplicate split expense:', splitQbId);
          continue;
        }

        // Insert split expense
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            project_id: split.projectId,
            category_id: categoryId,
            amount: split.amount,
            date: expense.date,
            vendor_name: expense.vendor_name,
            description: split.notes ? `${expense.description || ''} - ${split.notes}`.trim() : expense.description,
            payment_method: normalizePaymentMethod(expense.payment_method),
            status: 'actual',
            includes_tax: false,
            expense_type: split.expenseType,
            notes: split.notes || null,
            qb_expense_id: splitQbId,
          } as any);

        if (insertError) {
          console.error('Error inserting split expense:', insertError);
        }
      }

      // Mark original as imported or remove from pending
      if (isDemoMode) {
        setPendingExpenses(prev => prev.filter(e => e.id !== expenseId));
      } else {
        await supabase
          .from('quickbooks_expenses')
          .update({ is_imported: true })
          .eq('id', expenseId);
        await fetchPendingExpenses();
      }

      toast({
        title: 'Split Complete!',
        description: `Expense split into ${splits.length} items`,
      });
      return true;
    } catch (error) {
      console.error('Error splitting expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to split expense',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchPendingExpenses, isDemoMode, pendingExpenses]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected && !isDemoMode) {
      fetchPendingExpenses();
    }
  }, [isConnected, fetchPendingExpenses, isDemoMode]);

  // Auto-sync on load if it's been a while since last sync
  useEffect(() => {
    if (!isConnected || isLoading || hasAutoSynced || isSyncing) return;

    const lastSyncStr = localStorage.getItem(LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    const timeSinceLastSync = Date.now() - lastSync;

    if (timeSinceLastSync > AUTO_SYNC_INTERVAL_MS) {
      console.log('Auto-syncing QuickBooks (last sync was', Math.round(timeSinceLastSync / 1000 / 60), 'minutes ago)');
      setHasAutoSynced(true);
      
      // Calculate 30-day lookback dates
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      syncExpenses(startDate, endDate, true);
    } else {
      setHasAutoSynced(true); // Prevent future auto-syncs this session
    }
  }, [isConnected, isLoading, hasAutoSynced, isSyncing, syncExpenses]);

  // Import all split expenses at once (when categories are already assigned from SmartSplit)
  const importAllSplits = useCallback(async (expenseIds: string[], projectId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch project categories to get category IDs
      const { data: projectCategories } = await supabase
        .from('project_categories')
        .select('id, category')
        .eq('project_id', projectId);

      if (!projectCategories) {
        toast({
          title: 'Error',
          description: 'Could not fetch project categories',
          variant: 'destructive',
        });
        return false;
      }

      // Create a map of category value -> id
      const categoryMap = new Map(projectCategories.map(c => [c.category, c.id]));

      // Get the expenses to import
      const expensesToImport = pendingExpenses.filter(e => expenseIds.includes(e.id));

      for (const expense of expensesToImport) {
        // Extract category from qb_id pattern like purchase_769_split_hardware
        const splitMatch = expense.qb_id?.match(/_split_([a-z_]+)$/);
        const categoryValue = splitMatch ? splitMatch[1] : null;

        if (!categoryValue) {
          console.warn('No category found in qb_id for expense:', expense.id);
          continue;
        }

        const categoryId = categoryMap.get(categoryValue as BudgetCategory);
        if (!categoryId) {
          console.warn('No matching category_id for:', categoryValue);
          continue;
        }

        // Check for duplicate before inserting
        const { data: existingBatch } = await supabase
          .from('expenses')
          .select('id')
          .eq('qb_expense_id', expense.id)
          .maybeSingle();

        if (existingBatch) {
          console.log('Skipping duplicate batch expense:', expense.id);
          continue;
        }

        // Insert into expenses table
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            project_id: projectId,
            category_id: categoryId,
            amount: expense.amount,
            date: expense.date,
            vendor_name: expense.vendor_name,
            description: expense.description,
            payment_method: normalizePaymentMethod(expense.payment_method),
            status: 'actual',
            includes_tax: false,
            expense_type: 'product',
            notes: expense.notes || null,
            qb_expense_id: expense.id,
          } as any);

        if (insertError) {
          console.error('Error inserting expense:', insertError);
          continue;
        }

        // Mark as imported in quickbooks_expenses
        await supabase
          .from('quickbooks_expenses')
          .update({ is_imported: true, project_id: projectId, category_id: categoryId })
          .eq('id', expense.id);
      }

      await fetchPendingExpenses();

      toast({
        title: 'Imported!',
        description: `${expensesToImport.length} split expenses imported`,
      });

      return true;
    } catch (error) {
      console.error('Error importing splits:', error);
      toast({
        title: 'Error',
        description: 'Failed to import split expenses',
        variant: 'destructive',
      });
      return false;
    }
  }, [pendingExpenses, fetchPendingExpenses, toast]);

  return {
    isConnected,
    isDemoMode,
    isLoading,
    isSyncing,
    pendingExpenses,
    connect,
    disconnect,
    syncExpenses,
    categorizeExpense,
    splitExpense,
    deleteExpense,
    fetchPendingExpenses,
    enableDemoMode,
    importAllSplits,
  };
}

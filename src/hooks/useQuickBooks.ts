import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function useQuickBooks() {
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<QuickBooksExpense[]>([]);
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
          if (event.data?.type === 'quickbooks-callback') {
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

  const syncExpenses = useCallback(async (startDate?: string, endDate?: string) => {
    if (isDemoMode) {
      setIsSyncing(true);
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Demo Sync Complete',
        description: `${MOCK_QB_EXPENSES.length} sample expenses available`,
      });
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('quickbooks-sync', {
        body: { startDate, endDate },
      });

      if (error) {
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync expenses from QuickBooks',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sync Complete',
        description: data?.message || 'Expenses synced successfully',
      });

      // Fetch pending expenses
      await fetchPendingExpenses();
    } catch (error) {
      console.error('Error syncing expenses:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync expenses from QuickBooks',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
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
    categoryId: string
  ) => {
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
          payment_method: expense.payment_method as 'cash' | 'check' | 'card' | 'transfer' || 'card',
          status: 'actual',
          includes_tax: false,
        });

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
      const { error } = await supabase
        .from('quickbooks_expenses')
        .update({ 
          project_id: projectId, 
          category_id: categoryId,
          is_imported: true 
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

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected && !isDemoMode) {
      fetchPendingExpenses();
    }
  }, [isConnected, fetchPendingExpenses, isDemoMode]);

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
    deleteExpense,
    fetchPendingExpenses,
    enableDemoMode,
  };
}

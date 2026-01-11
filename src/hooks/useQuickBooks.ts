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

export function useQuickBooks() {
  const [isConnected, setIsConnected] = useState(false);
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
  }, [toast]);

  const syncExpenses = useCallback(async (startDate?: string, endDate?: string) => {
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
  }, [toast]);

  const fetchPendingExpenses = useCallback(async () => {
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
  }, []);

  const categorizeExpense = useCallback(async (
    expenseId: string, 
    projectId: string, 
    categoryId: string
  ) => {
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
  }, [toast, fetchPendingExpenses]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (isConnected) {
      fetchPendingExpenses();
    }
  }, [isConnected, fetchPendingExpenses]);

  return {
    isConnected,
    isLoading,
    isSyncing,
    pendingExpenses,
    connect,
    disconnect,
    syncExpenses,
    categorizeExpense,
    fetchPendingExpenses,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/hooks/useTeam';
import { toast } from 'sonner';

export interface OrderRequestItem {
  id: string;
  order_request_id: string;
  procurement_item_id: string;
  quantity: number;
  unit_price: number;
  item_name: string;
  item_image_url: string | null;
  item_source_url: string | null;
  item_source_store: string | null;
  owner_decision: 'approved' | 'rejected' | null;
  owner_notes: string | null;
  created_at: string;
}

export interface OrderRequest {
  id: string;
  team_id: string;
  submitted_by: string;
  status: 'pending' | 'partially_approved' | 'completed' | 'rejected';
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderRequestItem[];
  submitter_name?: string;
}

export interface SelectedProcurementItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url: string | null;
  source_url: string | null;
  source_store: string | null;
}

export function useOrderRequests() {
  const { user } = useAuth();
  const { team, members } = useTeam();
  const queryClient = useQueryClient();

  const isOwner = !!(user && team && team.owner_id === user.id);
  const isManager = !!(user && members.some(m => m.user_id === user.id && m.role === 'manager'));

  // Fetch order requests
  const { data: orderRequests = [], isLoading } = useQuery({
    queryKey: ['order-requests', team?.id, user?.id],
    queryFn: async () => {
      if (!user || !team) return [];

      const { data, error } = await supabase
        .from('procurement_order_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch order requests:', error);
        return [];
      }

      // Fetch items for each request
      const requestIds = data.map((r: { id: string }) => r.id);
      if (requestIds.length === 0) return [];

      const { data: itemsData, error: itemsError } = await supabase
        .from('procurement_order_request_items')
        .select('*')
        .in('order_request_id', requestIds);

      if (itemsError) {
        console.error('Failed to fetch order items:', itemsError);
      }

      // Attach submitter names from members
      const enriched: OrderRequest[] = data.map((r: OrderRequest) => {
        const member = members.find(m => m.user_id === r.submitted_by);
        const submitterName = member
          ? [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email || r.submitted_by
          : r.submitted_by;

        return {
          ...r,
          submitter_name: submitterName,
          items: ((itemsData || []) as Record<string, unknown>[])
            .filter(i => i['order_request_id'] === r.id)
            .map(i => ({
              ...i,
              owner_decision: (i['owner_decision'] as 'approved' | 'rejected' | null) ?? null,
            })) as OrderRequestItem[],
        };
      });

      return enriched;
    },
    enabled: !!user && !!team,
    retry: false,
    staleTime: 10000,
  });

  const pendingCount = orderRequests.filter(r => r.status === 'pending' || r.status === 'partially_approved').length;

  // Submit a new order request (PM)
  const submitOrder = useMutation({
    mutationFn: async ({
      selectedItems,
      notes,
    }: {
      selectedItems: SelectedProcurementItem[];
      notes: string;
    }) => {
      if (!user || !team) throw new Error('Not authenticated');

      // Insert the order request
      const { data: requestData, error: requestError } = await supabase
        .from('procurement_order_requests')
        .insert({
          team_id: team.id,
          submitted_by: user.id,
          notes: notes.trim() || null,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Insert all line items (snapshot)
      const lineItems = selectedItems.map(item => ({
        order_request_id: requestData.id,
        procurement_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        item_name: item.name,
        item_image_url: item.image_url,
        item_source_url: item.source_url,
        item_source_store: item.source_store,
      }));

      const { error: itemsError } = await supabase
        .from('procurement_order_request_items')
        .insert(lineItems);

      if (itemsError) throw itemsError;

      return requestData;
    },
    onSuccess: () => {
      toast.success('Order request submitted');
      queryClient.invalidateQueries({ queryKey: ['order-requests'] });
    },
    onError: (err) => {
      console.error('Failed to submit order:', err);
      toast.error('Failed to submit order request');
    },
  });

  // Owner: approve or reject a single line item
  const updateItemDecision = useMutation({
    mutationFn: async ({
      itemId,
      decision,
      ownerNotes,
    }: {
      itemId: string;
      decision: 'approved' | 'rejected' | null;
      ownerNotes?: string;
    }) => {
      const { error } = await supabase
        .from('procurement_order_request_items')
        .update({
          owner_decision: decision,
          owner_notes: ownerNotes ?? null,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-requests'] });
    },
    onError: () => toast.error('Failed to update decision'),
  });

  // Owner: mark all approved items as purchased
  const markOrderComplete = useMutation({
    mutationFn: async (orderId: string) => {
      const order = orderRequests.find(r => r.id === orderId);
      if (!order) throw new Error('Order not found');

      const approvedItems = order.items.filter(i => i.owner_decision === 'approved');

      // Update procurement_items status to 'ordered' for approved items
      if (approvedItems.length > 0) {
        const { error: itemsUpdateError } = await supabase
          .from('procurement_items')
          .update({ status: 'ordered' })
          .in('id', approvedItems.map(i => i.procurement_item_id));

        if (itemsUpdateError) throw itemsUpdateError;
      }

      // Mark order as completed
      const { error } = await supabase
        .from('procurement_order_requests')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Order marked as purchased');
      queryClient.invalidateQueries({ queryKey: ['order-requests'] });
    },
    onError: () => toast.error('Failed to complete order'),
  });

  return {
    orderRequests,
    isLoading,
    isOwner,
    isManager,
    pendingCount,
    submitOrder,
    updateItemDecision,
    markOrderComplete,
  };
}

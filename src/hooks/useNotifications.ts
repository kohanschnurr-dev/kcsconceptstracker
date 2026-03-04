import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/hooks/useTeam';

export interface Notification {
  id: string;
  owner_id: string;
  actor_id: string;
  event_type:
    | 'order_request'
    | 'expense'
    | 'daily_log'
    | 'task_completed'
    | 'project_note'
    | 'project_created'
    | 'project_status'
    | 'direct_message';
  entity_id: string | null;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export function loadNotificationPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('notification-preferences');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function useNotifications() {
  const { user } = useAuth();
  const { team } = useTeam();
  const queryClient = useQueryClient();

  const isOwner = !!team && team.owner_id === user?.id;

  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!user && isOwner,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // ── Supabase Realtime: push new notifications instantly ──────────────────
  useEffect(() => {
    if (!user || !isOwner) return;

    const channel = supabase
      .channel(`notifications-live-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isOwner, queryClient]);

  // Filter by user preferences (types toggled off are suppressed)
  const prefs = loadNotificationPrefs();
  const notifications = rawNotifications.filter(n => prefs[n.event_type] !== false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('owner_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('owner_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isOwner,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
  };
}

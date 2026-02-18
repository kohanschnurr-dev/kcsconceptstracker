import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ThreadMessage {
  id: string;
  team_id: string;
  sender_id: string;
  recipient_id: string | null;
  message: string;
  created_at: string;
}

interface UseMessageThreadOptions {
  teamId: string | null;
  pmId: string | null; // the PM's user_id
}

export function useMessageThread({ teamId, pmId }: UseMessageThreadOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    if (!teamId || !pmId) return;
    setIsLoading(true);
    try {
      // Fetch messages where this PM sent to owner (recipient_id IS NULL or recipient_id = owner)
      // OR owner replied to this PM (recipient_id = pmId)
      const { data, error } = await supabase
        .from('owner_messages')
        .select('*')
        .eq('team_id', teamId)
        .or(`sender_id.eq.${pmId},recipient_id.eq.${pmId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ThreadMessage[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch thread:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!teamId || !pmId) return;
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`thread-${teamId}-${pmId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'owner_messages',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const msg = payload.new as ThreadMessage;
          // Only add if related to this PM thread
          if (msg.sender_id === pmId || msg.recipient_id === pmId) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, pmId]);

  const sendReply = async (text: string): Promise<boolean> => {
    if (!text.trim() || !teamId || !pmId || !user) return false;
    setIsSending(true);
    try {
      const { error } = await supabase.from('owner_messages').insert({
        team_id: teamId,
        sender_id: user.id,
        recipient_id: pmId,
        message: text.trim(),
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast({
        title: 'Failed to send',
        description: 'Could not send your reply. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // PM-side: fetch own conversation (sent + received)
  const fetchPmThread = async (myTeamId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('owner_messages')
        .select('*')
        .eq('team_id', myTeamId)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ThreadMessage[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch PM thread:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // PM-side: send a message to owner
  const sendMessage = async (text: string, myTeamId: string): Promise<boolean> => {
    if (!text.trim() || !user) return false;
    setIsSending(true);
    try {
      const { error } = await supabase.from('owner_messages').insert({
        team_id: myTeamId,
        sender_id: user.id,
        message: text.trim(),
        recipient_id: null, // null = to owner
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      toast({
        title: 'Failed to send',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { messages, isLoading, isSending, sendReply, fetchPmThread, sendMessage, refetch: fetchMessages };
}

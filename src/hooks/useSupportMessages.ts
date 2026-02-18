import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SupportMessage {
  id: string;
  user_id: string;
  sender_role: string;
  message: string;
  message_type: string;
  subject: string | null;
  created_at: string;
}

export function useSupportMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages((data as SupportMessage[]) ?? []);
    } catch (err) {
      console.error('useSupportMessages fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMessages();

    const channel = supabase
      .channel(`support-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as SupportMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sendMessage = async (message: string): Promise<boolean> => {
    if (!user || !message.trim()) return false;
    setIsSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        user_id: user.id,
        sender_role: 'user',
        message: message.trim(),
        message_type: 'chat',
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('sendMessage error:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const submitFeatureRequest = async (subject: string, description: string): Promise<boolean> => {
    if (!user || !subject.trim() || !description.trim()) return false;
    setIsSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        user_id: user.id,
        sender_role: 'user',
        message: description.trim(),
        message_type: 'feature_request',
        subject: subject.trim(),
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('submitFeatureRequest error:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const chatMessages = messages.filter((m) => m.message_type === 'chat');
  const featureRequests = messages.filter((m) => m.message_type === 'feature_request');

  return {
    messages,
    chatMessages,
    featureRequests,
    isLoading,
    isSending,
    sendMessage,
    submitFeatureRequest,
    refetch: fetchMessages,
  };
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PmThreadSummary {
  pmId: string;
  pmName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

/**
 * Owner-side hook: fetches a summary of all PM conversations
 * (last message + unread count per PM) for the owner's team.
 */
export function useTeamMessages(teamId: string | null) {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<PmThreadSummary[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const buildSummaries = (
    messages: any[],
    memberMap: Record<string, string>,
    seenTimes: Record<string, number>
  ) => {
    // Group messages by PM
    const byPm: Record<string, any[]> = {};

    for (const msg of messages) {
      // PM messages have recipient_id = null (to owner) OR we need to find which PM
      // Owner replies have recipient_id = pmId
      // sender_id tells us who sent it
      const pmId = msg.recipient_id === null ? msg.sender_id : msg.recipient_id;
      if (!pmId || !memberMap[pmId]) continue; // skip owner's own messages or unknown

      if (!byPm[pmId]) byPm[pmId] = [];
      byPm[pmId].push(msg);
    }

    const results: PmThreadSummary[] = [];
    let total = 0;

    for (const [pmId, msgs] of Object.entries(byPm)) {
      // Sort ascending
      const sorted = [...msgs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const lastMsg = sorted[sorted.length - 1];

      // Unread = PM messages newer than last_seen_at for this PM
      const lastSeen = seenTimes[pmId] ?? 0;
      const unread = sorted.filter(
        (m) => m.sender_id === pmId && new Date(m.created_at).getTime() > lastSeen
      ).length;

      total += unread;

      results.push({
        pmId,
        pmName: memberMap[pmId] || 'Team Member',
        lastMessage: lastMsg.message,
        lastMessageAt: lastMsg.created_at,
        unreadCount: unread,
      });
    }

    // Sort by most recent message
    results.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    setSummaries(results);
    setTotalUnread(total);
  };

  const fetchData = async () => {
    if (!teamId || !user) return;
    setIsLoading(true);

    try {
      // Fetch all messages for this team
      const { data: messages, error: msgError } = await supabase
        .from('owner_messages')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // Fetch team members + their profile names
      const { data: members, error: memError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (memError) throw memError;

      // Build memberMap: pmId -> display name
      const memberMap: Record<string, string> = {};
      for (const m of members ?? []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', m.user_id)
          .maybeSingle();
        const name =
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
          'Team Member';
        memberMap[m.user_id] = name;
      }

      // Load last_seen_at from localStorage
      const seenRaw = localStorage.getItem('msg-last-seen') ?? '{}';
      const seenTimes: Record<string, number> = JSON.parse(seenRaw);

      buildSummaries(messages ?? [], memberMap, seenTimes);
    } catch (err) {
      console.error('useTeamMessages error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!teamId || !user) return;
    fetchData();

    const channel = supabase
      .channel(`team-messages-summary-${teamId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'owner_messages', filter: `team_id=eq.${teamId}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, user]);

  /** Call when the owner opens a PM's thread to mark it as seen */
  const markSeen = (pmId: string) => {
    const seenRaw = localStorage.getItem('msg-last-seen') ?? '{}';
    const seenTimes = JSON.parse(seenRaw);
    seenTimes[pmId] = Date.now();
    localStorage.setItem('msg-last-seen', JSON.stringify(seenTimes));
    // Recompute unread
    setSummaries((prev) =>
      prev.map((s) => (s.pmId === pmId ? { ...s, unreadCount: 0 } : s))
    );
    setTotalUnread((prev) => {
      const cleared = summaries.find((s) => s.pmId === pmId)?.unreadCount ?? 0;
      return Math.max(0, prev - cleared);
    });
  };

  return { summaries, totalUnread, isLoading, refetch: fetchData, markSeen };
}

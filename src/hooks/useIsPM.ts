import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Determines if the current user is a Project Manager (PM) —
 * i.e. they are a member of a team but NOT the team owner.
 * Also returns the team_id needed to insert into owner_messages.
 */
export function useIsPM() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['is-pm', user?.id],
    queryFn: async () => {
      if (!user) return { isPM: false, teamId: null };

      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error || !data) return { isPM: false, teamId: null };

      return { isPM: true, teamId: data.team_id };
    },
    enabled: !!user,
    staleTime: 30000,
    retry: false,
  });

  return {
    isPM: data?.isPM ?? false,
    teamId: data?.teamId ?? null,
    isLoading,
  };
}

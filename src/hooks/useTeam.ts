import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Team {
  id: string;
  owner_id: string;
  name: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  status: string;
  invited_at: string;
}

export function useTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch or auto-create the user's team
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['team', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newTeam, error: insertError } = await supabase
          .from('teams')
          .insert({ owner_id: user.id })
          .select()
          .single();
        if (insertError) throw insertError;
        return newTeam as Team;
      }

      return data as Team;
    },
    enabled: !!user,
  });

  // Fetch team members
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['team-members', team?.id],
    queryFn: async () => {
      if (!team) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', team.id)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Fetch profile info for each member
      const memberProfiles: TeamMember[] = [];
      for (const m of data) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', m.user_id)
          .maybeSingle();

        memberProfiles.push({
          ...m,
          first_name: profile?.first_name || undefined,
          last_name: profile?.last_name || undefined,
        });
      }

      return memberProfiles;
    },
    enabled: !!team,
  });

  // Fetch pending invitations
  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['team-invitations', team?.id],
    queryFn: async () => {
      if (!team) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', team.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!team,
  });

  const inviteMember = useMutation({
    mutationFn: async (email: string) => {
      if (!team) throw new Error('No team found');

      const { error } = await supabase
        .from('team_invitations')
        .insert({ team_id: team.id, email: email.toLowerCase() });

      if (error) {
        if (error.code === '23505') throw new Error('This email has already been invited');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', team?.id] });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', team?.id] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team?.id] });
    },
  });

  return {
    team,
    members,
    invitations,
    isLoading: isLoadingTeam || isLoadingMembers || isLoadingInvitations,
    inviteMember,
    cancelInvitation,
    removeMember,
  };
}

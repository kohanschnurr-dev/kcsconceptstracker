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

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: string;
  status: string;
  token: string | null;
  invited_at: string;
  expires_at: string | null;
}

/**
 * Generates a cryptographically secure 64-character hex token suitable for
 * use as an invite link token.  Uses the Web Crypto API (available in all
 * modern browsers and Supabase Edge Functions).
 */
function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Fetch (or auto-create) the current user's team ──────────────
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
        const { data: companyData } = await supabase
          .from('company_settings')
          .select('company_name')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: newTeam, error: insertError } = await supabase
          .from('teams')
          .insert({ owner_id: user.id, name: companyData?.company_name || null })
          .select()
          .single();

        if (insertError) {
          console.error('Failed to auto-create team:', insertError);
          throw insertError;
        }
        return newTeam as Team;
      }

      return data as Team;
    },
    enabled: !!user,
    retry: false,
    staleTime: 30000,
  });

  // ── Fetch team members with profile data ─────────────────────────
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['team-members', team?.id],
    queryFn: async () => {
      if (!team) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', team.id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch team members:', error);
        return [];
      }

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
    retry: false,
    staleTime: 30000,
  });

  // ── Fetch pending invitations ─────────────────────────────────────
  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['team-invitations', team?.id],
    queryFn: async () => {
      if (!team) return [];

      const { data, error } = await supabase
        .from('team_invitations')
        .select('id, team_id, email, role, status, token, invited_at, expires_at')
        .eq('team_id', team.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch team invitations:', error);
        return [];
      }
      return data as TeamInvitation[];
    },
    enabled: !!team,
    retry: false,
    staleTime: 30000,
  });

  // ── Invite a new member ───────────────────────────────────────────
  /**
   * Creates (or refreshes) an invitation with a secure token.
   *
   * Duplicate prevention: UPSERT on (team_id, email) so a second invite
   * to the same address refreshes the token and expiry instead of
   * throwing a unique-constraint error.
   *
   * Rate limiting: enforced at the Supabase RLS / Edge Function layer.
   * The client-side tier check in ManageUsersCard is the first gate.
   */
  const inviteMember = useMutation({
    mutationFn: async ({ email, role = 'viewer' }: { email: string; role?: string }) => {
      if (!team) throw new Error('No team found');

      const token     = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Upsert: on conflict (team_id, email) update token + expiry + role + status
      const { error } = await supabase
        .from('team_invitations')
        .upsert(
          {
            team_id:    team.id,
            email:      email.toLowerCase(),
            token,
            expires_at: expiresAt,
            role,
            status:     'pending',
          },
          { onConflict: 'team_id,email' }
        );

      if (error) throw error;

      // Fetch company name for white-label email
      const { data: companyData } = await supabase
        .from('company_settings')
        .select('company_name')
        .eq('user_id', user!.id)
        .maybeSingle();

      // Fire-and-forget email — DB record is already saved
      try {
        await supabase.functions.invoke('send-team-invite', {
          body: {
            email:       email.toLowerCase(),
            ownerName:   user?.email || 'A team owner',
            appUrl:      window.location.origin,
            token,
            role,
            companyName: companyData?.company_name || team.name || 'GroundWorks',
          },
        });
      } catch (emailErr) {
        // Don't surface this — the invitation row exists and can be resent
        console.error('Failed to send invite email:', emailErr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', team?.id] });
    },
  });

  // ── Resend invitation (refreshes token + expiry) ──────────────────
  /**
   * Generates a brand-new token, resets the 7-day expiry, and re-sends
   * the invitation email.  The old token immediately becomes invalid.
   */
  const resendInvitation = useMutation({
    mutationFn: async ({
      invitationId,
      email,
      role = 'viewer',
    }: {
      invitationId: string;
      email: string;
      role?: string;
    }) => {
      if (!team) throw new Error('No team found');

      const token     = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('team_invitations')
        .update({ token, expires_at: expiresAt, status: 'pending' })
        .eq('id', invitationId);

      if (error) throw error;

      const { data: companyData } = await supabase
        .from('company_settings')
        .select('company_name')
        .eq('user_id', user!.id)
        .maybeSingle();

      await supabase.functions.invoke('send-team-invite', {
        body: {
          email,
          ownerName:   user?.email || 'A team owner',
          appUrl:      window.location.origin,
          token,
          role,
          companyName: companyData?.company_name || team.name || 'GroundWorks',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', team?.id] });
    },
  });

  // ── Cancel / revoke an invitation ────────────────────────────────
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

  // ── Remove an active team member ──────────────────────────────────
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
    resendInvitation,
  };
}

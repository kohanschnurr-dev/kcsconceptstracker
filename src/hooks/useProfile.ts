import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  project_tab_order: string[] | null;
  detail_tab_order: Record<string, string[]> | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Create profile if it doesn't exist
      if (!data) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newProfile as Profile;
      }
      
      return data as Profile;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async ({ firstName, lastName }: { firstName: string; lastName: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ first_name: firstName, last_name: lastName })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateTabOrder = useMutation({
    mutationFn: async (tabOrder: string[]) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ project_tab_order: tabOrder } as any)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const updateDetailTabOrder = useMutation({
    mutationFn: async ({ projectType, tabOrder }: { projectType: string; tabOrder: string[] }) => {
      if (!user) throw new Error('Not authenticated');
      
      const current = (profile?.detail_tab_order || {}) as Record<string, string[]>;
      const updated = { ...current, [projectType]: tabOrder };
      
      const { error } = await supabase
        .from('profiles')
        .update({ detail_tab_order: updated } as any)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const getDetailTabOrder = (projectType: string, defaultOrder: string[]): string[] => {
    const saved = (profile?.detail_tab_order as Record<string, string[]> | null)?.[projectType];
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return defaultOrder;
  };

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : null;

  return {
    profile,
    isLoading,
    updateProfile,
    updateTabOrder,
    updateDetailTabOrder,
    getDetailTabOrder,
    displayName,
  };
}

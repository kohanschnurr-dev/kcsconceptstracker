import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  project_tab_order: string[] | null;
  detail_tab_order: Record<string, string[]> | null;
  starred_projects: string[] | null;
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
    mutationFn: async ({ firstName, lastName, city, state }: { firstName: string; lastName: string; city?: string; state?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const payload: Record<string, unknown> = { first_name: firstName, last_name: lastName };
      if (city !== undefined) payload.city = city;
      if (state !== undefined) payload.state = state;

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
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
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const merged = [...saved];
      for (const tab of defaultOrder) {
        if (!merged.includes(tab)) {
          const defaultIdx = defaultOrder.indexOf(tab);
          merged.splice(Math.min(defaultIdx, merged.length), 0, tab);
        }
      }
      return merged.filter(tab => defaultOrder.includes(tab));
    }
    return defaultOrder;
  };

  const starredProjects: string[] = Array.isArray(profile?.starred_projects) ? (profile.starred_projects as string[]) : [];

  const isProjectStarred = (projectId: string) => starredProjects.includes(projectId);

  const toggleStarProject = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user) throw new Error('Not authenticated');
      const current = [...starredProjects];
      const idx = current.indexOf(projectId);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        if (current.length >= 6) {
          throw new Error('max');
        }
        current.push(projectId);
      }
      const { error } = await supabase
        .from('profiles')
        .update({ starred_projects: current } as any)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (err: Error) => {
      if (err.message === 'max') {
        // handled by caller
      }
    },
  });

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
    starredProjects,
    isProjectStarred,
    toggleStarProject,
  };
}

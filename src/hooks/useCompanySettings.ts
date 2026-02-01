import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as CompanySettings | null;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async ({ companyName, logoUrl }: { companyName?: string; logoUrl?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const updateData: Record<string, unknown> = {};
      if (companyName !== undefined) updateData.company_name = companyName || null;
      if (logoUrl !== undefined) updateData.logo_url = logoUrl || null;

      // Check if settings exist
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('company_settings')
          .update(updateData)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_settings')
          .insert({ user_id: user.id, ...updateData });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    },
  });

  const uploadLogo = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/logo.${fileExt}`;

    // Delete existing logo if any
    await supabase.storage.from('company-logos').remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    uploadLogo,
    companyName: settings?.company_name || 'KCS Concepts',
    logoUrl: settings?.logo_url,
  };
}

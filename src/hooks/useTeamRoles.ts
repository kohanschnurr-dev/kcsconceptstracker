import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTeam } from '@/hooks/useTeam';

export const AVAILABLE_PERMISSIONS = [
  { key: 'view_projects', label: 'View Projects', description: 'Can see project details' },
  { key: 'edit_projects', label: 'Edit Projects', description: 'Can create/edit projects' },
  { key: 'manage_expenses', label: 'Manage Expenses', description: 'Can add/edit/delete expenses' },
  { key: 'manage_vendors', label: 'Manage Vendors', description: 'Can add/edit vendors' },
  { key: 'manage_procurement', label: 'Manage Procurement', description: 'Can manage procurement items' },
  { key: 'manage_budgets', label: 'Manage Budgets', description: 'Can create/edit budgets' },
  { key: 'manage_calendar', label: 'Manage Calendar', description: 'Can add/edit calendar events' },
  { key: 'view_reports', label: 'View Reports', description: 'Can view financial reports' },
  { key: 'manage_documents', label: 'Manage Documents', description: 'Can upload/delete documents' },
] as const;

export const AVAILABLE_ROLES = [
  { key: 'manager', label: 'Project Manager' },
  { key: 'viewer', label: 'Viewer' },
] as const;

export type RoleKey = typeof AVAILABLE_ROLES[number]['key'];
export type PermissionKey = typeof AVAILABLE_PERMISSIONS[number]['key'];

interface RolePermission {
  id: string;
  team_id: string;
  role: string;
  permission: string;
}

export function useTeamRoles() {
  const { team } = useTeam();
  const queryClient = useQueryClient();

  const { data: rolePermissions = [], isLoading } = useQuery({
    queryKey: ['team-role-permissions', team?.id],
    queryFn: async () => {
      if (!team) return [];
      const { data, error } = await supabase
        .from('team_role_permissions')
        .select('*')
        .eq('team_id', team.id);
      if (error) {
        console.error('Failed to fetch role permissions:', error);
        return [];
      }
      return data as RolePermission[];
    },
    enabled: !!team,
    retry: false,
    staleTime: 30000,
  });

  const getRolePermissions = (role: string): string[] => {
    return rolePermissions.filter(rp => rp.role === role).map(rp => rp.permission);
  };

  const hasPermission = (role: string, permission: string): boolean => {
    return rolePermissions.some(rp => rp.role === role && rp.permission === permission);
  };

  const togglePermission = useMutation({
    mutationFn: async ({ role, permission, enabled }: { role: string; permission: string; enabled: boolean }) => {
      if (!team) throw new Error('No team found');

      if (enabled) {
        const { error } = await supabase
          .from('team_role_permissions')
          .insert({ team_id: team.id, role, permission });
        if (error && error.code !== '23505') throw error;
      } else {
        const { error } = await supabase
          .from('team_role_permissions')
          .delete()
          .eq('team_id', team.id)
          .eq('role', role)
          .eq('permission', permission);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-role-permissions', team?.id] });
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team?.id] });
    },
  });

  return {
    rolePermissions,
    isLoading,
    getRolePermissions,
    hasPermission,
    togglePermission,
    updateMemberRole,
  };
}

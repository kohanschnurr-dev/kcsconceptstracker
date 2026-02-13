import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Shield, Lock, Crown, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useTeamRoles, AVAILABLE_PERMISSIONS, AVAILABLE_ROLES } from '@/hooks/useTeamRoles';
import { toast } from 'sonner';

export default function ManageRolesCard() {
  const { profile } = useProfile();
  const { isLoading, hasPermission, togglePermission } = useTeamRoles();

  const subscriptionTier = (profile as any)?.subscription_tier || 'free';
  const isPaid = subscriptionTier !== 'free';

  const handleToggle = async (role: string, permission: string, currentlyEnabled: boolean) => {
    try {
      await togglePermission.mutateAsync({ role, permission, enabled: !currentlyEnabled });
    } catch {
      toast.error('Failed to update permission');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Manage Roles
        </CardTitle>
        <CardDescription>
          Define what each role can do within your projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isPaid ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Role Management</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade your plan to customize team roles and permissions.
              </p>
            </div>
            <Button variant="default" size="sm" disabled>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {AVAILABLE_ROLES.map((role, roleIdx) => (
              <div key={role.key}>
                {roleIdx > 0 && <Separator className="mb-4" />}
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full group">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {role.label}
                    </Badge>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3">
                    <div className="grid gap-2">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const enabled = hasPermission(role.key, perm.key);
                        return (
                          <label
                            key={perm.key}
                            className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={enabled}
                              onCheckedChange={() => handleToggle(role.key, perm.key, enabled)}
                              disabled={togglePermission.isPending}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{perm.label}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

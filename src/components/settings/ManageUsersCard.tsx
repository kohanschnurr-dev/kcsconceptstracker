import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, X, Loader2, Lock, Crown, UserPlus } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ManageUsersCard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { team, members, invitations, isLoading, inviteMember, cancelInvitation, removeMember } = useTeam();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const subscriptionTier = (profile as any)?.subscription_tier || 'free';
  const isPaid = subscriptionTier !== 'free';

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember.mutateAsync(inviteEmail.trim());
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await cancelInvitation.mutateAsync(id);
      toast.success('Invitation cancelled');
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await removeMember.mutateAsync(id);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Manage Users
        </CardTitle>
        <CardDescription>Invite project managers to your team</CardDescription>
      </CardHeader>
      <CardContent>
        {!isPaid ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Team Management</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade your plan to invite project managers and collaborate with your team.
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
            {/* Owner */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="text-xs mt-0.5">Owner</Badge>
                </div>
              </div>
            </div>

            {/* Team Members */}
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email || 'Team Member'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pending Invitations
                </p>
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited {format(new Date(inv.invited_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}

            <Separator />

            {/* Invite Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} size="sm">
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Invited users will be able to access your projects when they sign up or log in.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

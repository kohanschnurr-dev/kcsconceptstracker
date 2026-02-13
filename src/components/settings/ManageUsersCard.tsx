import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, X, Loader2, Lock, Crown, UserPlus, RefreshCw } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamRoles, AVAILABLE_ROLES } from '@/hooks/useTeamRoles';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TIER_LIMITS: Record<string, number> = {
  free: 0,
  pro: 2,
  premium: Infinity,
};

export default function ManageUsersCard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { team, members, invitations, isLoading, inviteMember, cancelInvitation, removeMember, resendInvitation } = useTeam();
  const { updateMemberRole } = useTeamRoles();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const subscriptionTier = (profile as any)?.subscription_tier || 'free';
  const isPaid = subscriptionTier !== 'free';
  const maxSlots = TIER_LIMITS[subscriptionTier] ?? 0;
  const currentCount = (members?.length || 0) + (invitations?.length || 0);
  const atLimit = currentCount >= maxSlots;

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    if (atLimit) {
      toast.error("You've reached your plan's team member limit");
      return;
    }

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


  const handleResend = async (email: string) => {
    setResendingEmail(email);
    try {
      await resendInvitation.mutateAsync(email);
      toast.success(`Invitation resent to ${email}`);
    } catch {
      toast.error('Failed to resend invitation');
    } finally {
      setResendingEmail(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Manage Users
        </CardTitle>
        <CardDescription>
          {subscriptionTier === 'premium'
            ? 'Premium plan — unlimited team seats'
            : subscriptionTier === 'pro'
              ? 'Pro plan — 2 team seats'
              : 'Invite project managers to your team'}
        </CardDescription>
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

            {/* Seats indicator */}
            {maxSlots !== Infinity ? (
              <p className="text-xs text-muted-foreground">
                {currentCount} / {maxSlots} seats used
              </p>
            ) : currentCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {currentCount} {currentCount === 1 ? 'seat' : 'seats'} used
              </p>
            ) : null}

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
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role || 'manager'}
                    onValueChange={async (value) => {
                      try {
                        await updateMemberRole.mutateAsync({ memberId: member.id, role: value });
                        toast.success('Role updated');
                      } catch {
                        toast.error('Failed to update role');
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((r) => (
                        <SelectItem key={r.key} value={r.key}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Pending Invitations (inline) */}
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{inv.email}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">Pending</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResend(inv.email)}
                    disabled={resendingEmail === inv.email}
                    title="Resend invitation"
                  >
                    {resendingEmail === inv.email ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(inv.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Separator />

            {/* Invite Form */}
            <div className="flex gap-2">
              <Input
                placeholder={atLimit ? 'Seat limit reached' : 'Email address'}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                disabled={atLimit}
              />
              <Button onClick={handleInvite} disabled={atLimit || isInviting || !inviteEmail.trim()} size="sm">
                {isInviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
            {atLimit && subscriptionTier === 'pro' ? (
              <p className="text-xs text-muted-foreground">
                You've reached your Pro plan limit. Upgrade to Premium for unlimited team members.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Invited users will be able to access your projects when they sign up or log in.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

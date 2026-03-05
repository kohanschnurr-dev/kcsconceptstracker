import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, X, Loader2, Lock, Crown, UserPlus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTeam } from '@/hooks/useTeam';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamRoles, AVAILABLE_ROLES } from '@/hooks/useTeamRoles';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast } from 'date-fns';

const TIER_LIMITS: Record<string, number> = {
  free:    0,
  pro:     2,
  premium: Infinity,
};

export default function ManageUsersCard() {
  const { user }    = useAuth();
  const { profile } = useProfile();
  const {
    team, members, invitations, isLoading,
    inviteMember, cancelInvitation, removeMember, resendInvitation,
  } = useTeam();
  const { updateMemberRole } = useTeamRoles();

  const [inviteEmail, setInviteEmail]     = useState('');
  const [inviteRole,  setInviteRole]      = useState<'viewer' | 'manager'>('viewer');
  const [isInviting,  setIsInviting]      = useState(false);
  const [resendingId, setResendingId]     = useState<string | null>(null);

  const subscriptionTier = (profile as any)?.subscription_tier || 'free';
  const isPaid           = subscriptionTier !== 'free';
  const maxSlots         = TIER_LIMITS[subscriptionTier] ?? 0;
  const currentCount     = (members?.length || 0) + (invitations?.length || 0);
  const atLimit          = currentCount >= maxSlots;

  // ── Invite ────────────────────────────────────────────────────────
  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;

    if (atLimit) {
      toast.error("You've reached your plan's team member limit");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (email.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("You can't invite yourself");
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember.mutateAsync({ email, role: inviteRole });
      toast.success(`Invitation sent to ${email}`);
      setInviteEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  // ── Cancel invitation ────────────────────────────────────────────
  const handleCancelInvitation = async (id: string) => {
    try {
      await cancelInvitation.mutateAsync(id);
      toast.success('Invitation cancelled');
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  // ── Remove active member ──────────────────────────────────────────
  const handleRemoveMember = async (id: string) => {
    try {
      await removeMember.mutateAsync(id);
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  // ── Resend (regenerates token + resets expiry) ────────────────────
  const handleResend = async (inv: { id: string; email: string; role: string }) => {
    setResendingId(inv.id);
    try {
      await resendInvitation.mutateAsync({
        invitationId: inv.id,
        email:        inv.email,
        role:         inv.role,
      });
      toast.success(`New invitation link sent to ${inv.email}`);
    } catch {
      toast.error('Failed to resend invitation');
    } finally {
      setResendingId(null);
    }
  };

  // ── Expiry label helper ───────────────────────────────────────────
  const expiryLabel = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    if (isPast(new Date(expiresAt))) return { text: 'Expired', expired: true };
    return {
      text: `Expires ${formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}`,
      expired: false,
    };
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
              ? `Pro plan — 2 team seats`
              : 'Invite project managers to your team'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* ── Locked for free tier ── */}
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

            {/* ── Owner row ── */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="text-xs mt-0.5">Owner</Badge>
                </div>
              </div>
            </div>

            {/* ── Seat counter ── */}
            {maxSlots !== Infinity ? (
              <p className="text-xs text-muted-foreground">
                {currentCount} / {maxSlots} seats used
              </p>
            ) : currentCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                {currentCount} {currentCount === 1 ? 'seat' : 'seats'} used
              </p>
            ) : null}

            {/* ── Active team members ── */}
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
                    value={member.role || 'viewer'}
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
                        <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* ── Pending invitations ── */}
            {invitations.map((inv) => {
              const expiry    = expiryLabel(inv.expires_at);
              const isExpired = expiry?.expired ?? false;

              return (
                <div
                  key={inv.id}
                  className={`flex items-center justify-between py-2 ${isExpired ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isExpired ? 'bg-destructive/10' : 'bg-muted'}`}>
                      {isExpired
                        ? <AlertTriangle className="h-4 w-4 text-destructive" />
                        : <Mail className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{inv.email}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${isExpired ? 'border-destructive/50 text-destructive' : ''}`}
                        >
                          {isExpired ? 'Expired' : 'Pending'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {inv.role === 'manager' ? 'Project Manager' : 'Viewer'}
                        </Badge>
                        {expiry && !isExpired && (
                          <span className="text-xs text-muted-foreground">{expiry.text}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Resend — also refreshes token + expiry */}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleResend({ id: inv.id, email: inv.email, role: inv.role })}
                      disabled={resendingId === inv.id}
                      title={isExpired ? 'Resend (generate new link)' : 'Resend invitation'}
                    >
                      {resendingId === inv.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <RefreshCw className="h-4 w-4" />
                      }
                    </Button>
                    {/* Cancel / revoke */}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-destructive hover:text-destructive"
                      title="Cancel invitation"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <Separator />

            {/* ── Invite form ── */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={atLimit ? 'Seat limit reached' : 'Email address'}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  disabled={atLimit}
                  className="flex-1"
                />
                {/* Role selector sits beside the email input */}
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as 'viewer' | 'manager')}
                  disabled={atLimit}
                >
                  <SelectTrigger className="w-[130px] h-10 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="manager">Project Manager</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleInvite}
                  disabled={atLimit || isInviting || !inviteEmail.trim()}
                  size="sm"
                  className="h-10 px-3 shrink-0"
                >
                  {isInviting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <UserPlus className="h-4 w-4" />
                  }
                </Button>
              </div>

              {atLimit && subscriptionTier === 'pro' ? (
                <p className="text-xs text-muted-foreground">
                  You've reached your Pro plan limit. Upgrade to Premium for unlimited team members.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Invited users will be able to access your projects when they sign up or log in.
                  Invite links expire after <strong>7 days</strong>.
                </p>
              )}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}

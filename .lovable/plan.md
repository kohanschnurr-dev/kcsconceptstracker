

## Fix: Pending Invitations Not Showing (403 Error) + UI Confirmation

### Root Cause

The RLS policy "Invited users can view their invitation" on `team_invitations` uses a subquery against `auth.users`, which regular authenticated users cannot access. This causes **all** SELECT queries on the table to fail with a 403 "permission denied for table users" error -- which is why you see 0/2 seats even though 2 invitations exist in the database.

### Changes

**1. Database Migration -- Fix RLS Policy**

Drop and recreate the "Invited users can view their invitation" policy to use `auth.email()` instead of querying `auth.users`:

```sql
DROP POLICY IF EXISTS "Invited users can view their invitation" ON team_invitations;

CREATE POLICY "Invited users can view their invitation"
  ON team_invitations
  FOR SELECT
  USING (lower(email) = lower(auth.email()));
```

This is the only change needed. Once this is applied:
- The owner will see pending invitations inline (code already handles this)
- Seat count will correctly show `2 / 2 seats used`
- Resend and cancel (X) buttons are already implemented and will work
- Pending invitations count toward the seat limit, preventing excess invites

### No Code Changes Needed

The `ManageUsersCard.tsx` and `useTeam.ts` files already have all the UI and logic in place from the previous updates -- pending invitations inline with "Pending" badge, resend button, cancel button, and seat counting. The only blocker was this broken RLS policy.


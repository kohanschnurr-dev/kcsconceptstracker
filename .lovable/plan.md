

## Count Pending Invitations as Seats + Show Inline with "Pending" Badge + Resend Button

### Changes

**File: `src/components/settings/ManageUsersCard.tsx`**

1. **Pending invitations count toward seats** -- Already working (line 30: `currentCount = members.length + invitations.length`). The display just needs to reflect this visually.

2. **Show pending invitations inline** (not in a separate section) -- Move pending invitations up into the main user list, right after the owner and any accepted members. Each pending invite shows:
   - Mail icon
   - Email address
   - A yellow/amber "Pending" badge
   - A "Resend" button (refresh/send icon) alongside the cancel (X) button

3. **Remove the separate "Pending Invitations" section** -- Since they now appear inline in the main list.

4. **Add resend functionality** -- A "Resend" button on each pending invitation that re-triggers the `send-team-invite` edge function. Add a `resendInvitation` handler that calls `supabase.functions.invoke('send-team-invite', ...)` with the invitation email, shows a success toast, and has a brief loading state.

**File: `src/hooks/useTeam.ts`**

5. **Add `resendInvitation` mutation** -- New mutation that invokes the `send-team-invite` edge function for a given email without creating a new DB record (just re-sends the email).

### Visual Result

```
kohanschnurr@gmail.com
  [Owner]

invited@example.com
  [Pending]                    [Resend] [X]

1 / 2 seats used
```

### Technical Details

In `useTeam.ts`, add:
```typescript
const resendInvitation = useMutation({
  mutationFn: async (email: string) => {
    const ownerName = user?.email || 'A team owner';
    const appUrl = window.location.origin;
    await supabase.functions.invoke('send-team-invite', {
      body: { email, ownerName, appUrl },
    });
  },
});
```

In `ManageUsersCard.tsx`:
- Import `RefreshCw` from lucide-react for the resend icon
- Add `resendInvitation` from `useTeam()`
- Render pending invitations in the main list with a "Pending" badge and resend button
- Remove the separate "Pending Invitations" section below the separator


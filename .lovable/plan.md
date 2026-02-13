

## Add Tier-Based Team Member Limits

### Overview

Enforce team member limits based on the user's subscription tier:
- **Free**: No team access (locked UI, as it is now)
- **Pro**: Up to 2 extra team members (not counting the owner)
- **Premium**: Unlimited team members

### What Changes

**File: `src/components/settings/ManageUsersCard.tsx`**

1. Add a tier-to-limit mapping:
   - `free` = 0, `pro` = 2, `premium` = Infinity

2. Calculate `currentCount` as `members.length + invitations.length` (total seats used, excluding the owner).

3. Show a usage indicator below the owner row, e.g. "2 / 2 seats used" for Pro, or "3 seats used" for Premium.

4. Disable the invite form (input + button) and show a message like "You've reached your plan limit" when `currentCount >= maxSlots`.

5. For Pro users at their limit, show a subtle prompt to upgrade to Premium for unlimited members.

6. Update the card description to reflect the tier, e.g. "Pro plan -- 2 team seats" or "Premium plan -- unlimited seats".

### Technical Details

```text
Tier limits (defined as a constant in ManageUsersCard.tsx):

const TIER_LIMITS: Record<string, number> = {
  free: 0,
  pro: 2,
  premium: Infinity,
};
```

- `maxSlots = TIER_LIMITS[subscriptionTier] ?? 0`
- `currentCount = members.length + invitations.length`
- `atLimit = currentCount >= maxSlots`

The invite button and input get `disabled={atLimit || isInviting || !inviteEmail.trim()}`. When `atLimit` is true, the helper text changes to indicate the limit is reached with a suggestion to upgrade (for Pro users only).

No database changes needed -- limits are enforced purely in the UI. The `handleInvite` function will also check the limit before submitting as a safeguard.

### Files to Modify
- `src/components/settings/ManageUsersCard.tsx`

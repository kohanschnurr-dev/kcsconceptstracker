

## Fix Email Delivery: Update Resend Sender Domain

### Problem
Resend's API rejects all emails because the edge function sends from `onboarding@resend.dev` (a sandbox domain). Resend only allows sending test emails to the account owner's email. No emails reach other recipients.

### Prerequisites (User Action Required)
1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g., `kcsconcepts.com`)
3. Configure the DNS records Resend provides (SPF, DKIM, etc.)
4. Wait for verification to complete

### Code Change

**File: `supabase/functions/send-team-invite/index.ts`**

Update the `from` address from `"FlipTracker <onboarding@resend.dev>"` to use the verified domain, e.g.:

```
from: "FlipTracker <noreply@kcsconcepts.com>"
```

This is a single-line change on the line that currently reads:
```typescript
from: "FlipTracker <onboarding@resend.dev>",
```

### Summary

| Step | Who | What |
|------|-----|------|
| 1 | You | Verify a domain in Resend dashboard |
| 2 | Lovable | Update the `from` address in the edge function |
| 3 | Test | Send an invitation to confirm delivery |

No other code changes are needed -- the invitation logic, database records, and UI are all working correctly. The only blocker is Resend rejecting the unverified sender domain.


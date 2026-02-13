

## Send Email Invitations for Team Members

### Overview

When you invite someone to your team, they'll receive a professional email prompting them to sign up on FlipTracker and join your team. We'll create a backend function that sends the email automatically when you click the invite button.

### How It Works

1. You enter an email and click Invite (same as now)
2. The invitation is saved to the database (same as now)
3. **New**: A backend function is called that sends a branded email to the invited person
4. The email contains a link to your app's sign-up page with a special token so they're auto-added to your team when they create their account

### Email Service

We'll use **Resend** as the email provider -- it's simple, reliable, and has a generous free tier (100 emails/day). You'll need to:
- Create a free account at resend.com
- Get an API key (takes 30 seconds)
- Optionally verify a custom domain later (for now, emails send from Resend's default domain)

No need to set up a Gmail account -- Resend handles delivery for you and emails look more professional.

### What the Invited Person Sees

They'll receive an email like:

> **Subject:** You've been invited to join a team on FlipTracker
>
> Hi there,
>
> You've been invited to join a team on FlipTracker as a project manager.
>
> Click the link below to create your account and get started:
>
> **[Join Team on FlipTracker]**
>
> If you already have an account, simply log in and you'll be added to the team automatically.

### Auto-Join on Sign Up

When the invited person signs up (or logs in), the app will check if their email has any pending team invitations. If so, they'll be automatically added to the team and the invitation status will be updated to "accepted."

### Technical Details

**New backend function: `send-team-invite`**
- Receives the invitation email, team owner name, and invite token
- Sends a branded HTML email via Resend API
- Called from the `useTeam` hook after successfully inserting the invitation

**New secret needed: `RESEND_API_KEY`**
- You'll be prompted to enter this when we implement

**Modified file: `src/hooks/useTeam.ts`**
- After inserting the invitation, call the `send-team-invite` edge function

**New file: `supabase/functions/send-team-invite/index.ts`**
- Edge function that sends the invitation email

**Modified file: `src/contexts/AuthContext.tsx`** (or a new hook)
- On login/signup, check `team_invitations` for a matching email
- If found, auto-create a `team_members` row and update the invitation status to "accepted"

**New database function (migration):**
- `accept_pending_invitations(p_user_id uuid, p_email text)` -- security definer function that checks for pending invitations matching the email and adds the user to the team

### Files to Create
- `supabase/functions/send-team-invite/index.ts`

### Files to Modify
- `src/hooks/useTeam.ts` -- call edge function after invite
- `src/contexts/AuthContext.tsx` -- auto-accept invitations on login
- Database migration -- add `accept_pending_invitations` function


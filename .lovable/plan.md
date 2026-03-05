

## Fix Build Errors + Redirect "Start Free Trial" to Sign-Up Page

### Problem 1: Build errors
The `team_invitations` table is missing columns (`role`, `token`, `expires_at`) and the RPC `accept_invitation_by_token` doesn't exist. These were referenced in code but never created via migration.

### Problem 2: "Start Free Trial" opens a lead-capture modal instead of navigating to signup

---

### Fix 1 — Database migration
Add the missing columns to `team_invitations`:

```sql
ALTER TABLE public.team_invitations
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '7 days');
```

Create the missing `accept_invitation_by_token` RPC:

```sql
CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(p_user_id uuid, p_email text, p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
BEGIN
  SELECT * INTO v_inv FROM team_invitations
    WHERE token = p_token AND email = p_email AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  -- Add user to team_members
  INSERT INTO team_members (team_id, user_id, role)
    VALUES (v_inv.team_id, p_user_id, v_inv.role)
    ON CONFLICT DO NOTHING;
  -- Mark invitation accepted
  UPDATE team_invitations SET status = 'accepted' WHERE id = v_inv.id;
  RETURN jsonb_build_object('success', true);
END;
$$;
```

### Fix 2 — AuthContext RPC response handling (lines 54-58)
The RPC returns `jsonb`, but TypeScript infers `boolean`. Cast the response:

```typescript
.then(({ data, error }) => {
  if (error) console.error('accept_invitation_by_token error:', error);
  else {
    const result = data as { success: boolean; error?: string };
    if (!result.success) console.warn('Token invitation not accepted:', result.error);
  }
});
```

### Fix 3 — "Start Free Trial" → navigate to `/auth`
In these files, replace `openModal()` calls with `navigate("/auth")` for the trial button:

- **`src/components/landing/Hero.tsx`** — `handleTrialClick`: change `openModal()` to `navigate("/auth")`
- **`src/components/landing/FinalCTA.tsx`** — `handleClick`: change `openModal()` to `navigate("/auth")`
- **`src/pages/Pricing.tsx`** — `handleTrialClick`: change `openModal()` to `navigate("/auth")`
- **`src/pages/Demo.tsx`** — `handleTrialClick`: change `openModal()` to `navigate("/auth")`
- **`src/components/landing/LandingHeader.tsx`** — `handleTrialClick` (line 41) and mobile drawer button (line 131): change `openModal()` to `navigate("/auth")`

Remove `useLeadCapture` imports from all five files since they'll no longer be needed there.

### Summary
- 1 database migration (add columns + create RPC)
- 1 file fix for type handling (`AuthContext.tsx`)
- 5 files updated to redirect trial buttons to `/auth`


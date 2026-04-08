

## Fix All Security Findings

Seven findings to address across database functions, RLS policies, and an edge function.

---

### 1. Harden Invitation RPCs — Use `auth.uid()` and `auth.jwt()` Instead of Client Params

**Migration SQL:**

**`accept_invitation_by_token`** — Remove `p_user_id` and `p_email` params. Derive them from `auth.uid()` and `auth.users` inside the function.

**`accept_pending_invitations`** — Same approach: remove `p_user_id` and `p_email`, use `auth.uid()` and look up email from `auth.users`.

**Client code (`AuthContext.tsx`)** — Update both RPC calls to pass no arguments (just `p_token` for the token-based one).

---

### 2. Restrict `add_budget_category` RPC

**Migration SQL:** Revoke public execute and add an owner-only guard inside the function. The function will check that the caller owns a team (i.e., is an account owner) before executing the DDL. This prevents arbitrary users from flooding the enum.

```sql
-- Inside the function, add:
IF NOT EXISTS (SELECT 1 FROM public.teams WHERE owner_id = auth.uid()) THEN
  RAISE EXCEPTION 'Only account owners can add budget categories';
END IF;
```

---

### 3. Harden `send-team-invite` Edge Function — Remove `appUrl` Parameter

**`supabase/functions/send-team-invite/index.ts`** — Remove the `appUrl` parameter from the request body entirely. Hard-code the production URL server-side. This eliminates the phishing vector.

---

### 4. Lock Down Notifications INSERT Policy

**Migration SQL:** Drop the overly permissive `"Authenticated can insert notifications"` policy. The existing SECURITY DEFINER trigger functions (`fn_notify_*`) bypass RLS automatically, so no replacement INSERT policy is needed for application logic.

---

### 5. QuickBooks Token Encryption — Acknowledged (Hard, Low Priority)

The QB token encryption uses MD5 + hardcoded salt. A proper fix requires migrating to Supabase Vault, which is a significant infrastructure change. This will be **marked as acknowledged** but not fixed in this batch due to complexity and low exploitability (requires DB-level access).

---

### Files Changed

| File | Change |
|------|--------|
| **New migration SQL** | Rewrite `accept_invitation_by_token` and `accept_pending_invitations` to use `auth.uid()`; add owner guard to `add_budget_category`; drop notifications INSERT policy |
| `src/contexts/AuthContext.tsx` | Remove `p_user_id` and `p_email` params from both RPC calls |
| `supabase/functions/send-team-invite/index.ts` | Remove `appUrl` from request body; hard-code production URL |

### Security Findings Disposition

| Finding | Action |
|---------|--------|
| Invitation RPC trusts client email | **Fix** — derive from auth |
| `add_budget_category` open DDL | **Fix** — owner-only guard |
| Invite `appUrl` injection | **Fix** — remove param |
| Notifications unrestricted INSERT (×2 findings) | **Fix** — drop policy |
| RLS Policy Always True (linter) | **Fix** — same as notifications |
| QB token weak encryption | **Acknowledge** — requires Vault migration |


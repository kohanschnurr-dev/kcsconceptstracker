

## Fix: Infinite Recursion in Teams RLS Policies

### Root Cause
The database is throwing **"infinite recursion detected in policy for relation teams"** on every query to the `teams` table. This prevents team creation, which in turn prevents email invitations from being sent.

The recursion happens because:
1. The `teams` table has a SELECT policy that queries `team_members`
2. The `team_members` table has a policy that queries `teams`
3. This creates a circular dependency that Postgres cannot resolve

There's also a bug in the SELECT policy: `tm.team_id = tm.id` should be `tm.team_id = teams.id`.

### Fix

Replace the problematic "Team members can view their team" policy on `teams` with one that avoids the circular reference. Instead of checking `team_members` (which checks back to `teams`), use the `get_team_owner_id` database function (which is `SECURITY DEFINER` and bypasses RLS).

**Database migration to run:**

```sql
-- Drop the recursive policy
DROP POLICY IF EXISTS "Team members can view their team" ON teams;

-- Re-create it using the security definer function to avoid recursion
CREATE POLICY "Team members can view their team"
  ON teams
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    id IN (
      SELECT tm.team_id FROM team_members tm WHERE tm.user_id = auth.uid()
    )
  );
```

Wait -- that still references `team_members` which references `teams`. The proper fix is to make the `team_members` policies NOT reference `teams` for the SELECT path, or use `SECURITY DEFINER` functions.

Better approach -- fix BOTH tables:

```sql
-- 1. Drop the recursive teams policy
DROP POLICY IF EXISTS "Team members can view their team" ON teams;

-- 2. Replace team_members "Owners can manage" policy to avoid querying teams
DROP POLICY IF EXISTS "Owners can manage team members" ON team_members;

-- 3. Re-create teams SELECT policy using a security definer function
CREATE POLICY "Team members can view their team"
  ON teams
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
  );

-- 4. Re-create team_members management policy using security definer function
CREATE POLICY "Owners can manage team members"
  ON team_members
  FOR ALL
  USING (get_team_owner_id(user_id) = auth.uid() OR user_id = auth.uid())
  WITH CHECK (get_team_owner_id(user_id) = auth.uid() OR user_id = auth.uid());
```

Actually the cleanest fix: make the `team_members` owner check use the existing `SECURITY DEFINER` function `get_team_owner_id` which bypasses RLS, breaking the cycle.

### Final Plan

**1. Database migration** -- Fix the circular RLS policies:

- Drop the buggy "Team members can view their team" policy on `teams`
- Drop the "Owners can manage team members" policy on `team_members` (it queries `teams`, causing the loop)
- Re-create "Owners can manage team members" on `team_members` using the existing `get_team_owner_id()` SECURITY DEFINER function (bypasses RLS, no recursion)
- Re-create "Team members can view their team" on `teams` that queries `team_members` (safe now because `team_members` no longer queries back to `teams`)
- Also fix the similar policy on `team_invitations` if it has the same circular issue

**2. No code changes needed** -- the `useTeam.ts` and email logic are correct; they just can't run because every database call to `teams` fails.

### Technical Details

The `get_team_owner_id` function already exists as `SECURITY DEFINER` (runs with elevated privileges, bypasses RLS), making it perfect for breaking the circular reference:

```sql
-- Step 1: Fix team_members policies (break the cycle)
DROP POLICY IF EXISTS "Owners can manage team members" ON team_members;
CREATE POLICY "Owners can manage team members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
    )
  );
```

Wait -- that still queries teams. The key insight is: the `teams` SELECT policy must NOT query `team_members` if `team_members` queries `teams`. So the simplest fix:

**Replace the `teams` SELECT policy to only use `auth.uid() = owner_id`** (owners can see their team) **plus a SECURITY DEFINER function** for member access:

```sql
-- New security definer function for member check
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  )
$$;

-- Fix teams SELECT policy
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
CREATE POLICY "Team members can view their team"
  ON teams FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    public.is_team_member(id, auth.uid())
  );
```

This breaks the recursion because `is_team_member` is `SECURITY DEFINER` and bypasses RLS on `team_members`.

### Summary of Changes

| What | Action |
|------|--------|
| New DB function `is_team_member` | SECURITY DEFINER function to check membership without RLS |
| Teams "view" policy | Replace with one using `is_team_member()` to avoid recursion |
| No code changes | The existing code in useTeam.ts and send-team-invite is correct |

Once the RLS recursion is fixed, team auto-creation will work, and email invitations will be sent successfully.


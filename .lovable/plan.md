

## Add Team Management ("Manage Users") to Settings

### Overview

Add a "Manage Users" section below "Manage Sources" on the Settings page. This lets account owners invite project managers to their team. The feature is gated behind a subscription plan -- free-tier users see a prompt to upgrade, while paid users can invite, remove, and manage team members.

### What Changes

1. **New database tables:**
   - `teams` -- one row per account owner, holds the team name and owner reference
   - `team_members` -- maps users to a team with a role (owner, manager)
   - `team_invitations` -- pending invites by email, with status tracking

2. **New "Manage Users" card on Settings page** (below Manage Sources):
   - Free-tier users see a locked state with an "Upgrade" prompt
   - Paid users see:
     - A list of current team members (name, email, role, joined date)
     - An "Invite Member" form (email input + send button)
     - Pending invitations with the ability to cancel them
     - A "Remove" button for each member (except the owner)

3. **Invitation flow:**
   - Owner enters an email and clicks Invite
   - A row is created in `team_invitations`
   - When the invited user signs up or logs in, they see a banner or are auto-added to the team
   - For now, invitations are stored in the database; email notifications can be added later

4. **Data sharing:**
   - Team members (managers) see the same projects, expenses, vendors, etc. as the owner
   - This is achieved by updating RLS policies on key tables so that `user_id = owner OR user is a member of owner's team`
   - A `get_team_owner_id` security-definer function returns the owner's user_id for a given team member, used in RLS policies

5. **Subscription gating:**
   - A `subscription_tier` column on the `profiles` table (default: `'free'`) controls access
   - The UI checks this value to show/hide the team management features
   - Actual payment integration (Stripe, etc.) is a separate future step -- for now the tier can be toggled manually or via an admin function

### User Experience

```text
Settings Page
+-----------------------------+
| Account                     |
+-----------------------------+
| Company Branding            |
+-----------------------------+
| Manage Sources              |
+-----------------------------+
| Manage Users        [NEW]   |
|  +-----------------------+  |
|  | Your Team             |  |
|  | - You (Owner)         |  |
|  | - jane@co.com (Mgr)   |  |
|  | [Invite by email]     |  |
|  +-----------------------+  |
+-----------------------------+
| Color Palette               |
+-----------------------------+
| Legal                       |
+-----------------------------+
```

### Technical Details

**Database migrations:**

```sql
-- Subscription tier on profiles
ALTER TABLE profiles ADD COLUMN subscription_tier text NOT NULL DEFAULT 'free';

-- Teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Team members
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'manager',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team invitations
CREATE TABLE team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz DEFAULT now(),
  UNIQUE(team_id, email)
);
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Security-definer function to get team owner
CREATE OR REPLACE FUNCTION get_team_owner_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.owner_id
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.user_id = p_user_id
  LIMIT 1
$$;

-- RLS policies for teams/members/invitations (owner-only access)
```

**New file: `src/components/settings/ManageUsersCard.tsx`**
- Card component with team member list, invite form, pending invitations
- Uses a new `useTeam` hook for data fetching and mutations

**New file: `src/hooks/useTeam.ts`**
- Queries `teams`, `team_members`, `team_invitations`
- Mutations: `createTeam`, `inviteMember`, `removeMember`, `cancelInvitation`
- Auto-creates a team row for the owner if one doesn't exist

**Modified file: `src/pages/Settings.tsx`**
- Import and render `ManageUsersCard` between Manage Sources and Color Palette

**Modified file: `src/hooks/useProfile.ts`**
- Expose `subscription_tier` from the profile data

### RLS Policy Approach (for later expansion)

Initially, team members will only be managed from this Settings page. In a follow-up phase, RLS policies on `projects`, `expenses`, `vendors`, etc. would be updated to allow access for team members using the `get_team_owner_id` function. This keeps the initial scope manageable.

### Files to Create
- `src/hooks/useTeam.ts`
- `src/components/settings/ManageUsersCard.tsx`

### Files to Modify
- Database: new tables + subscription_tier column
- `src/pages/Settings.tsx` -- add ManageUsersCard
- `src/hooks/useProfile.ts` -- expose subscription_tier


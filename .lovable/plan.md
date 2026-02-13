

## Manage Roles Card -- Role-Based Permissions for Team Members

### Overview
Add a "Manage Roles" card above the "Manage Users" card on the Settings page. The team owner can define what each role is allowed to do within the app, and assign roles to team members.

### Database Changes

**1. New table: `team_role_permissions`**
Stores which permissions are enabled for each role within a team.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| team_id | uuid | FK to teams |
| role | text | e.g. 'manager', 'viewer' |
| permission | text | e.g. 'manage_expenses', 'edit_projects' |
| created_at | timestamptz | Default now() |
| UNIQUE(team_id, role, permission) | | Prevent duplicates |

RLS: Owner of the team can manage; team members can read their team's permissions.

**2. Predefined permissions (stored as text values):**

| Permission Key | Label | Description |
|----------------|-------|-------------|
| `view_projects` | View Projects | Can see project details |
| `edit_projects` | Edit Projects | Can create/edit projects |
| `manage_expenses` | Manage Expenses | Can add/edit/delete expenses |
| `manage_vendors` | Manage Vendors | Can add/edit vendors |
| `manage_procurement` | Manage Procurement | Can manage procurement items |
| `manage_budgets` | Manage Budgets | Can create/edit budgets |
| `manage_calendar` | Manage Calendar | Can add/edit calendar events |
| `view_reports` | View Reports | Can view financial reports |
| `manage_documents` | Manage Documents | Can upload/delete documents |

**3. Predefined roles:**
- **Project Manager** (default role for invited members) -- all permissions enabled by default
- **Viewer** -- only `view_projects` and `view_reports` enabled

### New Files

**`src/components/settings/ManageRolesCard.tsx`**
- Card with Shield icon and "Manage Roles" title
- Shows available roles (Project Manager, Viewer) as tabs or sections
- Each role shows a checklist of permissions the owner can toggle on/off
- Owner can assign a role to each team member via a dropdown in the Manage Users card
- Only visible to paid plans (same gate as Manage Users)

**`src/hooks/useTeamRoles.ts`**
- Fetches permissions for the team from `team_role_permissions`
- Mutations to toggle permissions on/off for a role
- Mutation to update a member's role

### Modified Files

**`src/pages/Settings.tsx`**
- Import and render `ManageRolesCard` above `ManageUsersCard`

**`src/components/settings/ManageUsersCard.tsx`**
- Add a role selector (dropdown) next to each team member showing their current role
- Owner can change a member's role from "Project Manager" to "Viewer" or vice versa
- Calls `updateMemberRole` mutation from `useTeamRoles`

**`src/hooks/useTeam.ts`**
- Add a `updateMemberRole` mutation that updates the `role` column on `team_members`

### Technical Details

```text
Settings Page Layout:
+---------------------------+
| Account                   |
+---------------------------+
| Company Branding          |
+---------------------------+
| Manage Sources            |
+---------------------------+
| Manage Roles     [NEW]    |
|  - Project Manager        |
|    [x] View Projects      |
|    [x] Edit Projects      |
|    [x] Manage Expenses    |
|    ...                    |
|  - Viewer                 |
|    [x] View Projects      |
|    [ ] Edit Projects      |
|    ...                    |
+---------------------------+
| Manage Users              |
|  Owner: you@email.com     |
|  member@email - [Manager▼]|
+---------------------------+
| Color Palette             |
+---------------------------+
```

The migration SQL will:
1. Create `team_role_permissions` table with RLS
2. Seed default permissions for existing teams (Project Manager gets all, Viewer gets view-only)

Permission enforcement in the frontend will check the current user's role and permissions before showing action buttons (edit, delete, create). This is a UI-level gate initially -- the RLS policies already restrict data by team membership.

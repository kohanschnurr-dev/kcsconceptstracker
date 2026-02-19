
## Backend Multi-Tenancy: Team-Aware Data Access

### What You're Describing (And What Currently Breaks It)

Your model is correct and already partially built:
- **Owner** = the company lead. They create the account and own all data.
- **Team Members (PMs)** = invited via email, they join the owner's team. They should see and interact with the same data as the owner — projects, expenses, vendors, tasks, etc.
- **Company isolation** = Company A members can NEVER see Company B's data. Period.

**The problem today:** Every single data table has RLS policies that only allow `auth.uid() = user_id`. When a PM logs in, their `auth.uid()` does NOT match the owner's `user_id`, so they see **zero data** — blank projects list, blank expenses, nothing.

The infrastructure to fix this already exists in the database:
- `teams` table — links owners to their team
- `team_members` table — links PMs to their team
- `get_team_owner_id(user_id uuid)` — a security-definer function that, given a PM's user ID, returns their owner's user ID

This function is the key. It is already written and safe from RLS recursion. It is just not being used in any data table policies yet.

---

### The Security Chain (How It Works)

```text
PM (user_id = PM_uid) logs in
  ↓
RLS policy on `projects` checks:
  projects.user_id = get_team_owner_id(auth.uid())
  → get_team_owner_id(PM_uid) = OWNER_uid
  → projects.user_id = OWNER_uid  ✓  → access granted
  
Company B's PM logs in:
  → get_team_owner_id(Company_B_PM_uid) = Company_B_OWNER_uid
  → Company_A projects.user_id = Company_A_OWNER_uid ≠ Company_B_OWNER_uid  ✗  → blocked
```

Cross-company isolation is mathematically guaranteed by this chain.

---

### What the Migration Covers

One SQL migration adds new SELECT (and limited write) policies on all 17 data tables. **Existing owner policies are never touched** — owners continue working exactly as before.

**Tables that need team-member READ access (SELECT):**

| Table | How isolation is checked |
|---|---|
| `projects` | `projects.user_id = get_team_owner_id(auth.uid())` |
| `expenses` | via project → `projects.user_id = get_team_owner_id(...)` |
| `tasks` | `tasks.user_id = get_team_owner_id(auth.uid())` |
| `vendors` | `vendors.user_id = get_team_owner_id(auth.uid())` |
| `business_expenses` | `business_expenses.user_id = get_team_owner_id(...)` |
| `calendar_events` | `calendar_events.user_id = get_team_owner_id(...)` |
| `daily_logs` | via project |
| `daily_log_tasks` | via daily_log → project |
| `project_notes` | via project |
| `project_photos` | via project |
| `project_documents` | via project |
| `document_folders` | via project |
| `project_milestones` | via project |
| `project_vendors` | via project |
| `project_categories` | via project |
| `project_info` | via project |
| `procurement_items` | `procurement_items.user_id = get_team_owner_id(...)` |
| `procurement_bundles` | `procurement_bundles.user_id = get_team_owner_id(...)` |
| `procurement_item_bundles` | via procurement_items |
| `project_procurement_items` | via project |
| `loan_payments` | `loan_payments.user_id = get_team_owner_id(...)` |
| `budget_templates` | `budget_templates.user_id = get_team_owner_id(...)` |
| `quickbooks_expenses` | `quickbooks_expenses.user_id = get_team_owner_id(...)` |

**Tables that also need team-member WRITE access (INSERT/UPDATE):**

| Table | Why |
|---|---|
| `expenses` | PMs add expenses to projects |
| `daily_logs` | PMs submit daily field logs |
| `daily_log_tasks` | PMs manage tasks within their logs |
| `project_notes` | PMs add notes to projects |
| `project_photos` | PMs upload site photos |
| `project_documents` | PMs upload documents |
| `project_milestones` | PMs update milestone progress |
| `tasks` | PMs create and update their own tasks |

**Tables that stay owner-only (no PM access):**

| Table | Reason |
|---|---|
| `business_expenses` | Owner's company overhead — not PM's concern |
| `quickbooks_tokens` | OAuth credentials — owner-only |
| `pending_receipts` | QB receipt matching — owner-only |
| `profiles` | Personal profile — each user owns their own |
| `company_settings` | Owner's company identity |
| `teams`, `team_members`, `team_invitations` | Already correctly scoped |
| `notifications` | Already correctly scoped (owner sees them) |
| `loan_presets`, `budget_templates` | Owner's financial templates |
| `operation_codes`, `quarterly_goals` | Owner's personal productivity data |

---

### Write Policy Rules for PMs

For INSERT, PMs must write data into the **owner's** projects only. The pattern is:

```sql
-- PMs can add expenses to their owner's projects
CREATE POLICY "Team members can insert expenses for owner projects"
ON public.expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = expenses.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);
```

For `tasks`, since each task has its own `user_id`, PMs insert tasks as themselves (their own `user_id`). The task gets associated to an owner's project via `project_id`.

---

### What This Migration Does NOT Change

- No schema changes (no new columns, no new tables, no type changes)
- No existing policies are dropped or modified
- No frontend code changes
- No new database functions needed — `get_team_owner_id` already exists
- `profiles`, `teams`, `company_settings` remain strictly personal

---

### Files Changed

**1 new migration file:** `supabase/migrations/[timestamp]_team_member_data_access.sql`

Contains approximately 40 new RLS policies covering all 23 data tables listed above. Zero schema modifications.

After this migration, a PM who logs in will see exactly the same projects, expenses, vendors, tasks, calendar events, and documents as their owner — and will be completely blocked from seeing any data belonging to other companies.

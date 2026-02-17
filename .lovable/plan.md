
## "New Budget Applied" Notification System

### What It Does
When a budget is applied to a project via the "Apply to Project" action in the Create Budget modal, the project will be flagged. The next time the user opens either the Project Detail or Project Budget page, they will see a prominent banner saying **"A New Budget Was Applied"** with details about the new allocations. The user can then choose to **accept** (merge the new budget into the project's official budget) or **dismiss** the notification.

### How the Merge Works
- Matching categories: update existing budget amounts with new values
- New categories from the applied budget: add them to the project
- Old categories not in the new budget: keep them unchanged (no data loss)
- Expenses stay in their current categories -- no reassignment
- If the new total budget exceeds the sum of all category budgets, the surplus remains **unallocated** (no filler category created)

### Technical Detail

#### 1. Database Migration -- Add a `pending_budget` column to `projects`

Add a nullable JSONB column `pending_budget` to the `projects` table. When a budget is applied, instead of directly writing to `project_categories` and `total_budget`, the data is stored here as a pending payload:

```sql
ALTER TABLE projects ADD COLUMN pending_budget jsonb DEFAULT NULL;
```

The JSON shape will be:
```json
{
  "total_budget": 50000,
  "category_budgets": { "plumbing": 5000, "electrical": 8000, ... },
  "applied_at": "2026-02-17T12:00:00Z",
  "template_name": "Standard 3BR Flip"
}
```

#### 2. Update `CreateBudgetModal.tsx` -- Store as Pending

Modify `handleApplyToProject` to write the budget data into the `pending_budget` JSONB column instead of immediately writing to `project_categories` and updating `total_budget`. This stages the budget for user review.

#### 3. New Component: `PendingBudgetBanner.tsx`

A reusable banner component that:
- Accepts `projectId`, `pendingBudget` data, existing categories, and a `onResolved` callback
- Displays an alert-style card: "New Budget Was Applied" with the template name and total amount
- Shows a summary of category allocations being proposed
- Has two buttons: **Accept Budget** and **Dismiss**
- **Accept**: Runs the merge logic (upsert categories, update `total_budget`, clear `pending_budget` to null)
- **Dismiss**: Sets `pending_budget` to null without changing anything

#### 4. Update `ProjectDetail.tsx` -- Show Banner

- After fetching project data, check if `project.pending_budget` is not null
- If present, render `<PendingBudgetBanner>` at the top of the page content
- On resolve (accept or dismiss), refetch project data

#### 5. Update `ProjectBudget.tsx` -- Show Banner

- Same logic: check `project.pending_budget` after fetch
- Render `<PendingBudgetBanner>` above the budget summary cards
- On resolve, call `refreshData()`

### Files
- **Migration**: Add `pending_budget` JSONB column to `projects` table
- **Edit**: `src/components/CreateBudgetModal.tsx` -- Change `handleApplyToProject` to write to `pending_budget` instead of directly applying
- **Create**: `src/components/project/PendingBudgetBanner.tsx` -- New banner component with accept/dismiss logic
- **Edit**: `src/pages/ProjectDetail.tsx` -- Render banner when pending budget exists
- **Edit**: `src/pages/ProjectBudget.tsx` -- Render banner when pending budget exists

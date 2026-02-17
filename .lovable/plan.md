

## Fix: Budget Approval Pop-up Not Appearing

### Root Cause
There are **two separate "Apply to Project" code paths**, but only one was updated to use the pending budget staging system:

- `CreateBudgetModal.tsx` -- correctly writes to `pending_budget` (staging)
- `BudgetCalculator.tsx` -- still **directly writes** to `project_categories`, bypassing the pending system entirely

The Budget Calculator page is the primary way budgets get applied, so the banner never appears.

### Fix

**File: `src/pages/BudgetCalculator.tsx`** -- Replace the `handleApplyToProject` function

Instead of directly inserting/updating `project_categories` and `total_budget`, rewrite it to store the budget data into the `pending_budget` JSONB column, matching the pattern already used in `CreateBudgetModal.tsx`:

```
pending_budget = {
  total_budget: <calculated total>,
  category_budgets: { plumbing: 5000, electrical: 8000, ... },
  applied_at: <now>,
  template_name: <budget name or null>
}
```

This is roughly a ~40-line function replacement -- removing the existing direct-write logic (fetching existing categories, looping through updates/inserts, updating total_budget) and replacing it with a single `.update({ pending_budget: payload })` call.

### What Changes
- **Edit**: `src/pages/BudgetCalculator.tsx` -- Rewrite `handleApplyToProject` to stage via `pending_budget` instead of direct-writing to `project_categories`

### What to Test After
1. Go to Budget Calculator, build a budget, and click "Apply to Project" on any project
2. Navigate to that project's detail page or budget page -- you should now see the "New Budget Was Applied" banner
3. Test "Accept" and "Dismiss" buttons on the banner
4. Verify the old direct-apply behavior no longer happens (categories shouldn't change until you click Accept)

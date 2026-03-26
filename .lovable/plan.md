

## Plan: Fix Save Budget Error + Timeline Phase Movement

### Two Issues

**Issue 1 — Save Budget fails with "column total_budget can only be updated to DEFAULT"**
The `total_budget` column on `budget_templates` is a `GENERATED ALWAYS` column that only sums 22 hardcoded legacy categories. Postgres forbids writing to it. The frontend sends `total_budget` in both insert and update payloads (line 426 of BudgetCalculator.tsx), causing the error.

**Issue 2 — Moving categories between timeline phases doesn't work**
In `handleSaveGroupSettings` (BudgetCanvas.tsx line 518), the cleanup loop only checks `Object.keys(newCustom)` — phases that already have custom overrides. Default phases like "Other" are invisible to this loop, so moved categories stay duplicated in their original phase.

### Changes

#### 1. Database migration
- Drop the generated `total_budget` column from `budget_templates`
- Re-add it as a normal `NUMERIC` column with a default of 0
- Backfill all existing rows by summing all numeric values in `category_budgets` (excluding the `_meta` key), so templates like "Farmers Branch Flip" immediately show correct totals

#### 2. BudgetCalculator.tsx (~line 426)
- Keep computing `totalBudget` client-side and sending it in the payload — once the column is no longer generated, this will work correctly and ensure the stored value always matches the actual sum

#### 3. BudgetCanvas.tsx (~lines 516-523)
Replace the cleanup loop:
```
Object.keys(newCustom).forEach(key => { ... })
```
With a loop over ALL effective phases using `timelineGroups`:
```
for (const group of timelineGroups) {
  if (group.key === activeGroupKey) continue;
  const existing = newCustom[group.key] || group.categories;
  if (existing.some(c => movedHere.has(c))) {
    newCustom[group.key] = existing.filter(c => !movedHere.has(c));
    if (newCustom[group.key].length === 0) delete newCustom[group.key];
  }
}
```
This ensures that when a category is moved to a new phase, it is removed from its source phase even if that source had no prior custom override. Removed categories go to Other (they become unassigned and fall through to the Other bucket automatically).

### Files touched
- New migration SQL file
- `src/pages/BudgetCalculator.tsx` (no change needed if migration succeeds — payload stays the same)
- `src/components/budget/BudgetCanvas.tsx` (~10 lines changed)


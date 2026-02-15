

## Persist "To Date" Term Selection

### Problem
When you click "To Date" and save, only the numeric month value is saved. On remount, the calculator doesn't know you had "To Date" selected -- it just sees a number that may not match any preset, so it looks like a custom term.

### Solution
Add a `hm_use_to_date` boolean column to the `projects` table. When the user clicks "To Date", set a local flag. On save, persist that flag. On mount, if the flag is true, auto-select "To Date" mode and recalculate from the project start date.

### Database Migration
Add column:
```sql
ALTER TABLE projects ADD COLUMN hm_use_to_date boolean DEFAULT false;
```

### Changes to `src/components/project/HardMoneyLoanCalculator.tsx`

1. **New prop**: `initialUseToDate?: boolean`
2. **New state**: `useToDate` boolean, initialized from prop
3. **When "To Date" is clicked**: set `useToDate = true`
4. **When any other term button is clicked** (6, 12, 18, Custom, etc.): set `useToDate = false`
5. **On mount**: if `useToDate` is true and `toDateMonths` is valid, set `loanTermMonths` to `toDateMonths` and `termDaysOverride` to `toDateDays` (one-time effect)
6. **handleSave**: include `hm_use_to_date: useToDate` in the update
7. **Highlight logic**: use `useToDate` flag for the "To Date" button variant instead of comparing `loanTermMonths === toDateMonths` (which can drift as days pass)

### Changes to `src/pages/ProjectDetail.tsx`

Pass the new prop:
```
initialUseToDate={(project as any).hm_use_to_date ?? false}
```

### Files to Change
- **Database**: Add `hm_use_to_date` column
- `src/components/project/HardMoneyLoanCalculator.tsx` -- Add flag state, persist it, restore on mount
- `src/pages/ProjectDetail.tsx` -- Pass the new prop

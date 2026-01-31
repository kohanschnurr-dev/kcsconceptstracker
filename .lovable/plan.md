

## Fix Export Reports - Include Actual Spending & Replace Variance with % Left

### The Problems
1. **Export reports show $0 spent** - The component calculates spending from passed `expenses`, but QuickBooks-imported expenses aren't included in that array
2. **User wants "% Left of Budget" instead of "Variance %"** - Currently shows variance as a percentage difference from budget

### Root Cause Analysis
In `ProjectDetail.tsx`:
- Categories are passed WITH `actualSpent` already calculated (includes both regular + QB expenses)
- BUT the `ExportReports` component ignores this and recalculates from `expenses` array alone
- The `expenses` array only contains manual expenses, not QB-imported ones

### The Fix
1. Update the `Category` interface in ExportReports to include `actualSpent`
2. Use the pre-calculated `actualSpent` from categories instead of recalculating
3. Replace "Variance %" column with "% Left of Budget"

---

### Technical Changes

**File: `src/components/project/ExportReports.tsx`**

| Section | Change |
|---------|--------|
| Category Interface | Add `actualSpent: number` property |
| calculateCategorySpending() | Remove or update to use category.actualSpent directly |
| exportBudgetSummaryCSV() | Use category.actualSpent, change header to "% Left" |
| exportFullReportCSV() | Use category.actualSpent, change header to "% Left" |
| Card description | Update "variance analysis" text |

---

### Specific Code Changes

**1. Update Category Interface (line 22-27):**
```tsx
interface Category {
  id: string;
  category: string;
  estimated_budget: number;
  actualSpent: number;  // ADD THIS
}
```

**2. Update exportBudgetSummaryCSV() (lines 117-152):**
- Change header from `'Variance %'` to `'% Left'`
- Use `cat.actualSpent` instead of `spending[cat.id]`
- Calculate percentage left: `((remaining / estimated_budget) * 100)`

**3. Update exportFullReportCSV() (lines 154-222):**
- Change header from `'Variance'` to `'% Left'`
- Use `cat.actualSpent` instead of `spending[cat.id]`

**4. Update UI description (line 305):**
- Change "with variance analysis" to "with budget analysis"

---

### Before vs After (CSV Output)

**Before:**
```
Category, Estimated Budget, Actual Spent, Remaining, Variance %
Roofing, 6000.00, 0.00, 6000.00, 0.0%
```

**After:**
```
Category, Estimated Budget, Actual Spent, Remaining, % Left
Roofing, 6000.00, 5500.00, 500.00, 8.3%
```

---

### Summary
- Use the pre-calculated `actualSpent` from categories (which includes QB expenses)
- Replace "Variance %" with "% Left of Budget" for clearer understanding
- Update card description to match new column


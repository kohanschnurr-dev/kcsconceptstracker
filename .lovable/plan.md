

## Plan: Add Hard Costs / Soft Costs View Mode

Add a third view mode ("Cost Type") to the existing Category / Timeline toggle in BudgetCanvas that splits all budget line items into two collapsible groups: **Hard Costs** and **Soft Costs**.

### How it works

Users click a new "Cost Type" button in the existing view mode toggle bar (alongside Category and Timeline). Categories are classified as either Hard or Soft based on a static mapping — the same classification used in new construction estimating (permits, closing costs, architecture, engineering, insurance = soft; everything else = hard).

### Changes

**File: `src/lib/budgetCalculatorCategories.ts`**
- Add a `COST_TYPE_MAP` that classifies categories as `'hard'` or `'soft'`. Soft costs include: permits, inspections, closing_costs, insurance_project, taxes, hoa, architecture/plans-type items, staging, and any financing-related custom groups. Default = `'hard'`.
- Add a `buildCostTypeGroups()` function that returns two groups (Hard Costs with a `Hammer` icon, Soft Costs with a `FileText` icon), each containing the relevant category values — same shape as `buildBudgetCalcGroups` output.

**File: `src/components/budget/BudgetCanvas.tsx`**
- Expand `viewMode` state type from `'category' | 'timeline'` to `'category' | 'timeline' | 'costtype'`.
- Import `buildCostTypeGroups` and compute a `costTypeGroups` memo.
- Update `displayGroups` to use `costTypeGroups` when `viewMode === 'costtype'`.
- Add a third "Cost Type" button in the view mode toggle bar (between Timeline and the star).
- Hide the "Add Phase" button when in costtype mode (it's timeline-only).

### Files touched
- `src/lib/budgetCalculatorCategories.ts` (~25 lines added)
- `src/components/budget/BudgetCanvas.tsx` (~15 lines changed)


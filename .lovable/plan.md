

## Show Total Budget and Add "Needs Allocation" Banner

### Problem
Two issues after the new $0-category initialization:

1. **Total Budget shows $0 on Project Detail page** -- it sums category budgets (all $0) instead of using the project-level `total_budget` field
2. **Budget by Category shows 51 rows of $0** -- noisy and unhelpful when no budgets have been allocated

### Changes

#### 1. Fix Total Budget display on Project Detail (`src/pages/ProjectDetail.tsx`)

Update the `totalBudget` calculation (line ~398-400) to use the same logic as `ProjectBudget.tsx`: prefer `project.total_budget` when set, fall back to category sum.

```
Before:  const totalBudget = categories.reduce(...)
After:   const categoryTotal = categories.reduce(...)
         const totalBudget = (project?.total_budget ?? 0) > 0 ? project.total_budget : categoryTotal
```

This ensures the manually entered or template-applied total budget displays correctly.

#### 2. Add "Needs Allocation" banner in Budget by Category section (`src/pages/ProjectBudget.tsx`)

When `totalBudget > 0` but `categoryTotal === 0` (budget exists but no categories have allocations), show a banner inside the "Budget by Category" collapsible section with:
- An alert icon and message: "**$X,XXX needs allocation** -- Assign budgets to categories using the Budget Calculator or manually edit each category."
- A button to navigate to the Budget Calculator: "Open Budget Calculator"

This replaces the current view of 51 rows of $0.00 with a clear call-to-action.

#### 3. Hide $0-budget categories from the table (`src/pages/ProjectBudget.tsx`)

When all categories have $0 budgets and $0 spent, only show the "Needs Allocation" banner (no table). When some categories have budgets and others don't:
- Show categories that have a budget > 0 OR have actual spending > 0
- Hide categories with both $0 budget and $0 spent -- they add no information

Add a subtle toggle/link below the table: "Show all categories" to reveal hidden ones if needed.

### Technical Details

**File: `src/pages/ProjectDetail.tsx`**
- Line ~398-400: Update `totalBudget` to check `project.total_budget` first

**File: `src/pages/ProjectBudget.tsx`**
- Line ~461-463: `categoryTotal` already computed; no change needed there
- Lines ~965-994 (Category Breakdown header area): Add the "Needs Allocation" banner conditionally when `totalBudget > 0 && categoryTotal === 0`
- Lines ~1027-1028 (category table body): Filter categories to only show those with `estimated_budget > 0 || actualSpent > 0` by default
- Add `showAllCategories` state toggle to reveal hidden $0 categories
- Import `Calculator` icon and `useNavigate` (already imported) for the banner button

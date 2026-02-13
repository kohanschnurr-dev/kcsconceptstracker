
## Show Profit Instead of Remaining on Project Cards

### What Changes
Replace the "Remaining" label/value on each project card with "Profit" calculated as:
**ARV - Purchase Price - MAX(Budget, Actual Construction Spent)**

This uses the budget as the rehab cost basis unless actual construction spending exceeds it, consistent with the conservative profit formula used elsewhere.

### Technical Changes

**1. `src/types/index.ts`** -- Add missing fields to the `Project` interface:
- `arv?: number`
- `purchasePrice?: number`
- `constructionSpent?: number`

These are already being set on project objects in Index.tsx and ProjectDetail.tsx but were accessed via `as any` casts.

**2. `src/components/dashboard/ProjectCard.tsx`** (lines 157-164):
- Replace the "Remaining" section with a "Profit" calculation
- Profit = ARV - Purchase Price - MAX(totalBudget, constructionSpent)
- Show in green if positive, red if negative
- If ARV is 0 or not set, show a dash instead of a misleading number
- Keep the rental card's "Expenses" label unchanged (rental projects already skip this section)

```typescript
// Replace "Remaining" with "Profit"
const arv = project.arv || 0;
const purchasePrice = project.purchasePrice || 0;
const constructionSpent = project.constructionSpent || 0;
const rehabBasis = Math.max(project.totalBudget, constructionSpent);
const profit = arv - purchasePrice - rehabBasis;
const hasProfit = arv > 0;
```

Display:
```
Profit
$XX,XXX (green/red)
```

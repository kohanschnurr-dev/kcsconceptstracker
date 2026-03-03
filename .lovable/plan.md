

## Fix: Budget Summary Cards Show Misleading Numbers

### The Core Problem

The two rows of stat cards are mixing scopes and creating contradictory information:

**Row 1** breaks expenses into 4 cost types: Construction, Loan, Holding, Transaction.
**Row 2** then shows "Total Spent" (all types combined) next to "Total Construction Budget" and "Remaining Construction Budget."

The "Remaining Construction Budget" card calculates `totalBudget - totalSpent`, but `totalSpent` includes ALL cost types. So it subtracts loan, holding, and transaction costs from the construction budget — making it look like you're $4,664 over budget when construction alone is only ~$700 over.

### The Fix

**File: `src/pages/ProjectBudget.tsx`**

**Change 1: Fix the "remaining" calculation (line ~474)**

Currently:
```typescript
const totalSpent = categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
const remaining = totalBudget - totalSpent;
```

`totalSpent` aggregates all expenses regardless of cost type. The "Remaining Construction Budget" card should compare against construction spending only:

```typescript
const remaining = totalBudget - constructionCosts;
```

This way: $153,200 - $152,506 = $693.85 remaining — which is accurate.

**Change 2: Clarify "Total Spent" card to show what it actually represents**

Rename "Total Spent" to "Total All-In Costs" and add a subtitle showing the breakdown: `Construction + Loan + Holding + Transaction`. This makes it immediately clear that this number spans all cost types and isn't directly comparable to the construction budget.

**Change 3: Update the progress bar calculation (line ~876)**

The progress bar currently uses `totalSpent / totalBudget` (all spend vs construction budget). Update it to use `constructionCosts / totalBudget` so it tracks construction progress accurately.

### Summary

| Line(s) | Change |
|---------|--------|
| ~474 | `remaining = totalBudget - constructionCosts` instead of `totalBudget - totalSpent` |
| ~731-736 | Rename "Total Spent" label to "Total All-In Costs", add subtitle with type breakdown |
| ~869-877 | Progress bar uses `constructionCosts` instead of `totalSpent` |

The numbers will now be internally consistent: construction budget tracks construction costs, and total spending is clearly labeled as all-inclusive.


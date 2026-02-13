

## Replace "Loan Payments" with "Profit Potential" Stat Card

### What It Does
The third stat card will show a realistic estimated profit across all active projects. It uses conservative logic so users don't get false hope from untouched budgets.

### Profit Calculation Logic

For each active project that has an ARV set:

```
Actual Spent = sum of all expense actuals for that project
Planned Budget = sum of category estimated budgets for that project

Cost Basis = MAX(Actual Spent, Planned Budget)
   -- If over budget, use actual spent (reality wins)
   -- If under budget, use planned budget (don't inflate profit)

Project Profit = ARV - Purchase Price - Cost Basis
```

Then sum across all active projects with ARV values.

The subtitle will show how many projects contribute (e.g., "Across 2 projects").

### Changes

**File: `src/pages/Index.tsx`**

1. **Remove** the loan payments database fetch and `totalLoanPayments` state
2. **Add** profit calculation logic after `activeProjects` is computed:
   - Loop through active projects that have `arv > 0` and `purchase_price`
   - For each, compare actual spent vs. planned budget, take the higher value as cost basis
   - Subtract purchase price and cost basis from ARV
   - Sum all project profits
3. **Replace** the Loan Payments `StatCard` with a "Profit Potential" card using a `TrendingUp` or `DollarSign`-style icon and a "success" or "default" variant

### Technical Details

**Removing loan fetch** (around lines 79-82): Delete the `loan_payments` query and `setTotalLoanPayments`. Remove the `totalLoanPayments` state variable.

**New calculation** (after line ~163):
```tsx
const profitProjectCount = activeProjects.filter(p => (p as any).arv > 0).length;
const totalProfitPotential = activeProjects.reduce((sum, p) => {
  const arv = (p as any).arv || 0;
  const purchasePrice = (p as any).purchasePrice || 0;
  if (arv <= 0) return sum;
  const plannedBudget = p.totalBudget;
  const actualSpent = p.categories.reduce((s, c) => s + c.actualSpent, 0);
  const costBasis = Math.max(actualSpent, plannedBudget);
  return sum + (arv - purchasePrice - costBasis);
}, 0);
```

**Project type update**: The `Project` type transform needs to carry `arv` and `purchasePrice` from the DB row so the calculation can access them.

**StatCard replacement** (around line 217):
```tsx
<StatCard
  title="Profit Potential"
  value={formatCurrency(totalProfitPotential)}
  subtitle={`Across ${profitProjectCount} project${profitProjectCount !== 1 ? 's' : ''}`}
  icon={TrendingUp}
  variant={totalProfitPotential >= 0 ? 'success' : 'danger'}
/>
```

This gives a realistic, conservative profit view -- if a project is over budget the real numbers show, and untouched budgets use planned costs rather than $0.


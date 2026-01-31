

## Two Profit Metrics: Estimated vs Current Profit

### What This Does
Updates the Profit Calculator to display two separate profit calculations:
- **Estimated Profit**: Based on your allocated budget (what you planned to spend)
- **Current Profit**: Based on actual expenses (what you've actually spent)

This gives you visibility into both your projected returns and your real-time position.

---

### Current Behavior
- Shows a single "Est. Profit" value
- Uses actual spending if available, otherwise falls back to budget
- No distinction between planned vs actual profit

### New Behavior
- **Estimated Profit** = ARV - Purchase Price - Total Budget - Closing Costs - Holding Costs
- **Current Profit** = ARV - Purchase Price - Current Expenses - Closing Costs - Holding Costs
- Both displayed side-by-side with clear labels
- ROI remains based on current investment

---

### Using Your Example

| Metric | Value |
|--------|-------|
| Total Budget (allocated) | $60,575 |
| Current Expenses (spent) | $39,717 |
| Difference | $20,858 |

This means your **Current Profit** will be higher than **Estimated Profit** by approximately $20,858 (assuming you stay within budget).

---

### Technical Changes

**File: `src/components/project/ProfitCalculator.tsx`**

Update the calculations section:
```typescript
// Estimated profit (based on allocated budget)
const estimatedInvestment = purchasePrice + totalBudget;
const estimatedTotalCosts = estimatedInvestment + closingCosts + holdingCosts;
const estimatedProfit = arv - estimatedTotalCosts;

// Current profit (based on actual spending)
const currentInvestment = purchasePrice + totalSpent;
const currentTotalCosts = currentInvestment + closingCosts + holdingCosts;
const currentProfit = arv - currentTotalCosts;
```

Update the results grid to show 3 cards:
```text
┌─────────────────┬─────────────────┬─────────────────┐
│   Est. Profit   │  Current Profit │       ROI       │
│    $46,063      │     $66,921     │     23.8%       │
│  (using budget) │ (using spent)   │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

---

### Layout Update

Change from 2-column to 3-column grid for the profit display:
- **Column 1**: Estimated Profit (based on $60,575 budget)
- **Column 2**: Current Profit (based on $39,717 spent)
- **Column 3**: ROI (based on current investment)

Each card will include a subtle label indicating which cost basis it uses.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/project/ProfitCalculator.tsx` | Add dual profit calculations and update display grid |

---

### Summary

- Add separate calculations for estimated vs current profit
- Display both values in the results section
- Clear labels so users understand the difference
- Estimated uses allocated budget, Current uses actual expenses


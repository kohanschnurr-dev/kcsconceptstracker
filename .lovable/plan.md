

## Plan: Add Toggle to Enable/Disable Closing Costs

### Overview

Add a toggle switch in the Deal Parameters sidebar that allows users to turn closing costs (both buying and selling) on or off. This is useful for rental properties or long-term holds where the user won't be selling the property.

---

### UI Changes

**DealSidebar - New Toggle in Estimated Costs Section:**

```text
Estimated Costs
┌──────────────────────────────────────┐
│ Include Closing Costs        [ON/OFF]│
├──────────────────────────────────────┤
│ Closing (Buy, 2%)           $5,000   │  ← shown/hidden
│ Holding (3%)                $7,500   │
│ Closing (Sell, 6%)         $21,000   │  ← shown/hidden
└──────────────────────────────────────┘
```

When toggled OFF:
- Hide the closing cost line items in the sidebar
- All profit calculations exclude closing costs
- Profit Breakdown in main area also hides those rows

---

### Implementation Details

**File: `src/pages/BudgetCalculator.tsx`**

| Change | Details |
|--------|---------|
| Add state | `const [includeClosingCosts, setIncludeClosingCosts] = useState(true)` |
| Update calculations | When OFF: `closingCostsBuy = 0`, `closingCostsSell = 0` |
| Pass to DealSidebar | Add prop to pass toggle state and handler |
| Update Profit Breakdown UI | Conditionally render closing cost rows |

**File: `src/components/budget/DealSidebar.tsx`**

| Change | Details |
|--------|---------|
| Add props | `includeClosingCosts: boolean`, `onClosingCostsChange: (value: boolean) => void` |
| Add Switch component | Toggle in Estimated Costs header section |
| Conditionally render | Hide closing cost rows when toggle is OFF |

---

### Visual Design

The toggle will be placed inline with the "Estimated Costs" header:

```text
Estimated Costs          [Switch]
───────────────────────────────
Closing (Buy, 2%)       $5,000   ← Only shown when ON
Holding (3%)            $7,500   ← Always shown
Closing (Sell, 6%)     $21,000   ← Only shown when ON
```

---

### Calculation Logic

```tsx
// Current (always applies closing costs)
const closingCostsBuy = purchasePriceNum * 0.02;
const closingCostsSell = arvNum * 0.06;

// New (respects toggle)
const closingCostsBuy = includeClosingCosts ? purchasePriceNum * 0.02 : 0;
const closingCostsSell = includeClosingCosts ? arvNum * 0.06 : 0;
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/BudgetCalculator.tsx` | Add toggle state, update calculations, update Profit Breakdown UI, pass props to sidebar |
| `src/components/budget/DealSidebar.tsx` | Add toggle props, render Switch component, conditionally show closing cost rows |


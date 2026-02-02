

## Plan: Update Toggle to Control Only Sell Closing Costs

### Clarification

You want:
- **Closing costs (Buy, 2%)** → Always included in calculations
- **Closing costs (Sell, 6%)** → Toggle on/off

The current toggle controls both buy AND sell closing costs. We need to update it so the buy closing costs are always included, and only the sell closing costs are toggled.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/pages/BudgetCalculator.tsx` | Rename state to `includeSellClosingCosts`, always calculate buy closing costs, only toggle sell |
| `src/components/budget/DealSidebar.tsx` | Update prop names, update label to "Sell Closing", always show buy closing costs row |

---

### Technical Details

**File: `src/pages/BudgetCalculator.tsx`**

| Current | New |
|---------|-----|
| `includeClosingCosts` state | `includeSellClosingCosts` state |
| `closingCostsBuy = includeClosingCosts ? ... : 0` | `closingCostsBuy = purchasePriceNum * 0.02` (always) |
| `closingCostsSell = includeClosingCosts ? ... : 0` | `closingCostsSell = includeSellClosingCosts ? arvNum * 0.06 : 0` |
| Conditionally show buy closing row | Always show buy closing row |
| Conditionally show sell closing row | Keep conditional based on toggle |

**File: `src/components/budget/DealSidebar.tsx`**

| Current | New |
|---------|-----|
| `includeClosingCosts` prop | `includeSellClosingCosts` prop |
| `onClosingCostsChange` prop | `onSellClosingCostsChange` prop |
| Label: "Closing" | Label: "Sell Closing" or "Incl. Sale" |
| Hide both buy/sell when OFF | Always show buy, hide only sell when OFF |
| `closingCostsBuy` respects toggle | `closingCostsBuy = purchasePriceNum * 0.02` (always) |

---

### Updated UI

**Sidebar - Estimated Costs Section:**

```text
ESTIMATED COSTS          [Sell Closing ◉]
─────────────────────────────────────────
Closing (Buy, 2%)           $3,140    ← Always shown
Holding (3%)                $4,710    ← Always shown
Closing (Sell, 6%)         $16,800    ← Only when toggle ON
```

---

### Updated Calculation Logic

```tsx
// BudgetCalculator.tsx
const [includeSellClosingCosts, setIncludeSellClosingCosts] = useState(true);

// Buy closing costs - ALWAYS included
const closingCostsBuy = purchasePriceNum * 0.02;

// Sell closing costs - TOGGLE controlled
const closingCostsSell = includeSellClosingCosts ? arvNum * 0.06 : 0;
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/BudgetCalculator.tsx` | Rename state, update calculations, always show buy row in Profit Breakdown |
| `src/components/budget/DealSidebar.tsx` | Rename props, update label, always show buy row, only toggle sell row |




## Plan: Compact MAO Gauge Layout with Custom Percentage Setting

### Overview

Redesign the MAO Gauge component to be more compact and add a customizable percentage setting that users can adjust from the default 78%.

---

### UI Changes

**Current Layout (too spaced out):**
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [icon] MAX OFFER (78% RULE)    [icon] REHAB BUDGET    [icon] UNDER MAO   │
│        $273,000                        $0                    +$95,000    │
│                                                                          │
│ Budget vs 78% of ARV ──────────────────────────────────────────── 0%     │
└──────────────────────────────────────────────────────────────────────────┘
```

**New Layout (compact, inline percentage control):**
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [icon] MAX OFFER    [icon] REHAB BUDGET    [icon] UNDER MAO    [78% ▼]  │
│        $273,000            $0                    +$95,000               │
│ Budget vs ARV ────────────────────────────────────────────────── 0%     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Changes Required

**File: `src/components/budget/MAOGauge.tsx`**

| Change | Details |
|--------|---------|
| Add percentage prop | Accept `maoPercentage` prop with default of 78 |
| Add percentage callback | Accept `onPercentageChange` for user adjustments |
| Remove "(78% Rule)" text | Change label from "Max Offer (78% Rule)" to just "Max Offer" |
| Add dropdown selector | Small dropdown showing current % with common options (70%, 75%, 78%, 80%) |
| Reduce padding | Change `p-4` to `p-3`, reduce icon sizes and gaps |
| Compact text sizing | Reduce `text-xl` to `text-lg` for values |
| Update progress label | Change "Budget vs 78% of ARV" to "Budget vs {percentage}% of ARV" |

**File: `src/pages/BudgetCalculator.tsx`**

| Change | Details |
|--------|---------|
| Add state for percentage | `const [maoPercentage, setMaoPercentage] = useState(78)` |
| Pass props to MAOGauge | Pass `maoPercentage` and `onPercentageChange` |
| Update calculations | Update `maxOffer` calculation to use dynamic percentage |

---

### Percentage Selector Design

The percentage selector will be a compact dropdown positioned at the far right of the gauge:

```text
┌──────┐
│ 78% ▾│  ← Current value shown with dropdown arrow
└──────┘
   │
   ▼
┌──────┐
│ 70%  │
│ 75%  │
│ 78%  │  ← Checkmark on current
│ 80%  │
│ 85%  │
│ Custom│ ← Opens input for custom value
└──────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/budget/MAOGauge.tsx` | Accept percentage props, compact layout, add dropdown selector |
| `src/pages/BudgetCalculator.tsx` | Add percentage state, pass to MAOGauge, update calculations |

---

### Visual Improvements

- **Reduced padding**: `p-4` → `p-3` for tighter layout
- **Smaller gaps**: `gap-3` → `gap-2` between elements
- **Compact values**: `text-xl` → `text-lg` for currency amounts
- **Inline percentage control**: Right-aligned dropdown instead of text in label
- **Shorter labels**: Remove verbose explanations from headers


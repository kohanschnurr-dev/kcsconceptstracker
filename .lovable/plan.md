
## Plan: Remove 78% Rule Section from Profit Calculator

### Overview

Remove the "78% Rule" check section from the Profit Calculator since the property has already been purchased and this pre-purchase analysis is no longer relevant.

### Changes

**File: `src/components/project/ProfitCalculator.tsx`**

| Lines | Change |
|-------|--------|
| 2 | Remove `Percent` from lucide-react imports |
| 73-75 | Remove the `maxOffer` and `meetsRule` calculations |
| 131-150 | Remove the entire 78% Rule display section |

### Code to Remove

```typescript
// Line 2: Remove Percent from import
import { Calculator, DollarSign, TrendingUp, Percent, Save, Loader2 } from 'lucide-react';
//                                            ^^^^^^^^ remove this

// Lines 73-75: Remove these calculations
const maxOffer = (arv * 0.78) - totalBudget;
const meetsRule = purchasePrice <= maxOffer;

// Lines 131-150: Remove entire 78% Rule section
{arv > 0 && (
  <div className={cn(...)}>
    <div className="flex items-center gap-2 mb-1">
      <Percent className="h-4 w-4" />
      <span className="font-medium">78% Rule</span>
    </div>
    <p className="text-sm text-muted-foreground">
      Max offer: ...
    </p>
  </div>
)}
```

### Result

The Profit Calculator will show just:
1. Purchase Price and ARV inputs
2. Est. Profit, Current Profit, and ROI metrics

No more "78% Rule" or "Max offer" guidance since the deal is already closed.

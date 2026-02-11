
## Add Profit Breakdown on Click

### What Changes
When clicking the "Est. Profit" or "Current Profit" cards, an expandable breakdown will appear showing exactly how the number was calculated.

### Breakdown Lines
The expanded view will show a clean line-item list:

```
ARV (Sale Price)             $260,000
- Purchase Price             $154,000
- Rehab Budget               $75,000    (or "Rehab Spent" for Current)
- Closing Costs (6% ARV)     $15,600
- Holding Costs (3%)          $4,620
                             --------
= Est. Profit                $10,780
```

### Technical Details

**File: `src/components/project/ProfitCalculator.tsx`**

1. Add state to track which breakdown is expanded (`'estimated' | 'current' | null`)
2. Make the Est. Profit and Current Profit cards clickable (cursor-pointer, subtle hover effect)
3. Below each card, conditionally render a breakdown panel with each cost as a line item showing label, percentage/basis, and dollar amount
4. Add a small chevron indicator on the cards to hint they are expandable
5. Import `ChevronDown`/`ChevronUp` from lucide-react

Single file change only. No new props or data needed -- all values are already computed in the component.

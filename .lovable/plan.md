
## Fix: Auto-open First Tab in Saved Order

### Root Cause

In `src/pages/BudgetCalculator.tsx` line 73:
```tsx
const [calculatorType, setCalculatorType] = useState<CalculatorType>('fix_flip');
```

This always defaults to `'fix_flip'` (Sale) regardless of the saved tab order. The `DealSidebar` separately reads `budget-calculator-tab-order` from localStorage to render the tabs in the right order, but `BudgetCalculator` never consults that value to pick the initial active tab.

### Fix

Change the `calculatorType` initial state to read from `localStorage` using the same key (`budget-calculator-tab-order`) and use the first item in the saved array as the default. If nothing is saved, fall back to `'fix_flip'`.

```tsx
// Before
const [calculatorType, setCalculatorType] = useState<CalculatorType>('fix_flip');

// After
const [calculatorType, setCalculatorType] = useState<CalculatorType>(() => {
  try {
    const saved = localStorage.getItem('budget-calculator-tab-order');
    if (saved) {
      const order = JSON.parse(saved) as CalculatorType[];
      if (order.length > 0) return order[0];
    }
  } catch {}
  return 'fix_flip';
});
```

This is a lazy initializer so it only runs once on mount — no performance impact.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/BudgetCalculator.tsx` | Change `calculatorType` useState from a hard-coded `'fix_flip'` to a lazy initializer that reads the first entry from the saved tab order in localStorage. |

One file, one change. No other files touched.

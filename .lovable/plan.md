

## Make "This Month" Stat Card Clickable to Navigate to Expenses

### Change

**File: `src/pages/Index.tsx`**

Wrap the "This Month" `StatCard` in an `onClick` handler that calls `navigate('/expenses')`. Add a `cursor-pointer` wrapper `div` so it feels interactive.

Alternatively, add an `onClick` prop to the `StatCard` component itself for cleaner reuse:

1. **`src/components/dashboard/StatCard.tsx`** -- Add an optional `onClick` prop. When provided, apply `cursor-pointer` and `hover:border-primary/30` styles to the card wrapper, and attach the click handler.

2. **`src/pages/Index.tsx`** -- Pass `onClick={() => navigate('/expenses')}` to the "This Month" `StatCard`.

This keeps the other stat cards unchanged and makes the pattern reusable if other cards need click actions later.




## Fix Raw Trade Values Showing for Removed Categories

### Problem
When a trade value exists on a vendor but has been removed from the available trade categories list, `getTradeLabel()` falls back to showing the raw database value (e.g., `foundation_repair`) instead of a human-readable label.

### Solution
Update the `getTradeLabel` function in `src/pages/Vendors.tsx` to format the raw value as a readable string when no matching category label is found. The fallback will convert underscores to spaces and capitalize each word.

### Technical Detail

**File: `src/pages/Vendors.tsx` (line 98-100)**

Change:
```tsx
const getTradeLabel = (trade: string) => {
  return getBudgetCategories().find(b => b.value === trade)?.label || trade;
};
```

To:
```tsx
const getTradeLabel = (trade: string) => {
  const found = getBudgetCategories().find(b => b.value === trade)?.label
    || getVendorTrades().find(t => t.value === trade)?.label;
  if (found) return found;
  return trade
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};
```

This checks both `getBudgetCategories()` and `getVendorTrades()` for a label match, then falls back to formatting the raw string (e.g., `foundation_repair` becomes `Foundation Repair`).


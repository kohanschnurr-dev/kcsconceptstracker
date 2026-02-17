

## Dynamic Trade Filter: Only Show Types in Use

### Problem
The trade filter dropdown currently lists all possible trade types from `getVendorTrades()`, including types no vendor has been assigned yet (e.g., "HOA" in the screenshot). This clutters the dropdown.

### Solution
Derive the filter options dynamically from the actual `vendors` array instead of the static `getVendorTrades()` list. Collect all unique trade values across all vendors, sort them alphabetically by their display label, and render only those in the dropdown.

### Technical Detail

**File: `src/pages/Vendors.tsx`**

Add a computed list of unique trades derived from vendors, placed after the `vendors` state is populated:

```tsx
const usedTrades = Array.from(new Set(vendors.flatMap(v => v.trades)))
  .map(value => ({ value, label: getTradeLabel(value) }))
  .sort((a, b) => a.label.localeCompare(b.label));
```

Then update the Select dropdown to use `usedTrades` instead of `getVendorTrades()`:

```tsx
<SelectContent>
  <SelectItem value="all">All Types</SelectItem>
  {usedTrades.map(t => (
    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
  ))}
</SelectContent>
```

This ensures only trades that exist on at least one vendor appear in the filter. As vendors are added/removed, the filter updates automatically.


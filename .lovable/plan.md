

## Add Vendor Type Filter

### What's Changing
A dropdown filter will be added next to the search bar on the Vendors page, letting users filter vendors by their trade/type (e.g., Plumbing, Electrical, General, etc.).

### Design
- A `Select` dropdown labeled "All Types" by default, placed inline next to the search input
- Options populated from `getVendorTrades()` (same trade list used elsewhere)
- Selecting a trade filters the vendor grid to only show vendors with that trade
- Works in combination with the existing text search
- An "All Types" option resets the filter

### Technical Detail

**File: `src/pages/Vendors.tsx`**

1. Add state: `const [tradeFilter, setTradeFilter] = useState<string>('all');`

2. Import `getVendorTrades` from `@/types` (alongside existing `getBudgetCategories`) and import `Select` components (already imported).

3. Update `filteredVendors` to also check trade filter:
```tsx
const filteredVendors = vendors.filter((vendor) => {
  const matchesSearch = vendor.name.toLowerCase().includes(search.toLowerCase()) ||
    vendor.trades.some(t => t.toLowerCase().includes(search.toLowerCase()));
  const matchesTrade = tradeFilter === 'all' || vendor.trades.includes(tradeFilter);
  return matchesSearch && matchesTrade;
});
```

4. Add a `Select` dropdown next to the search input (lines 150-158), changing the wrapper from `max-w-sm` to a flex row with both the search and the filter:
```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <div className="relative flex-1 max-w-sm">
    <Search ... />
    <Input ... />
  </div>
  <Select value={tradeFilter} onValueChange={setTradeFilter}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="All Types" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Types</SelectItem>
      {getVendorTrades().map(t => (
        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### Files
- **Edit**: `src/pages/Vendors.tsx` -- Add trade filter state, Select dropdown, and updated filter logic



## Plan: Add Custom Date Range Filter to Project Budget Expenses

### What
Add a "Custom Range" option to the date range filter dropdown in the All Expenses table. When selected, two date pickers appear (From / To) letting users pick exact start and end dates for quarterly reports or any custom period.

### Changes

**File: `src/pages/ProjectBudget.tsx`**

1. **Update state type** (line 148): Change `dateRange` type to include `'custom'` and add two new state variables for custom start/end dates:
   ```typescript
   const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d' | 'year' | 'custom'>('all');
   const [customDateStart, setCustomDateStart] = useState<Date | undefined>();
   const [customDateEnd, setCustomDateEnd] = useState<Date | undefined>();
   ```

2. **Update filter logic** (lines 449-453): Add a `custom` case that filters using the two custom dates:
   ```typescript
   if (dateRange === 'custom') {
     if (customDateStart) filtered = filtered.filter(exp => parseDateString(exp.date) >= customDateStart);
     if (customDateEnd) filtered = filtered.filter(exp => parseDateString(exp.date) <= customDateEnd);
   } else if (dateRange !== 'all') { ... existing logic ... }
   ```

3. **Add `customDateStart`/`customDateEnd` to the `useMemo` deps** (line 483).

4. **Update clear filters** (lines 539-541, 195, 206): Reset custom dates when clearing.

5. **Update `hasActiveFilters`** (line 544): Include custom date check.

6. **Add "Custom Range" option to the Select** (line 1348): Add `<SelectItem value="custom">Custom Range</SelectItem>`.

7. **Add date picker row** below the Select (after line 1350): When `dateRange === 'custom'`, render two `Popover` + `Calendar` date pickers (From / To) inline, using the existing shadcn Calendar component and `parseDateString`/`formatDateString` utilities.

### Files touched
- `src/pages/ProjectBudget.tsx` (~30 lines added)


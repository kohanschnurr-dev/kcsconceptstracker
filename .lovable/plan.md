

## Add "Filtered Results" Export Option

### What's Changing

A fourth export card, "Filtered Results," will be added to the Export Reports dialog. When selected, it will only export the expenses currently visible after applying filters (e.g., only "Cabinets" category). The card will show how many expenses are in the filtered set vs. the total.

### Technical Details

**`src/pages/ProjectBudget.tsx`** (~line 1642)

Pass `filteredExpenses` as a new prop alongside the existing `expenses`:

```tsx
<ExportReports
  project={...}
  categories={categories}
  expenses={expenses}
  filteredExpenses={filteredExpenses}
/>
```

**`src/components/project/ExportReports.tsx`**

1. Add `filteredExpenses` to the props interface (optional, defaults to full `expenses` list)
2. Add a fourth export option card -- "Filtered Results" -- with a `Filter` icon (from lucide-react) in an orange/amber color
3. The card description will dynamically show the count: e.g., "Export only the 12 currently filtered expenses"
4. Add a new `exportFilteredCSV()` function that works like `exportExpensesCSV()` but uses `filteredExpenses` instead of `expenses`
5. Wire up the new `'filtered-csv'` case in `handleExport`
6. Update the grid from `sm:grid-cols-3` to `sm:grid-cols-4` (or keep 3 and let the 4th wrap on smaller screens -- `sm:grid-cols-2 lg:grid-cols-4` for better responsiveness)
7. Only show/enable the "Filtered Results" card when there is an active filter (i.e., `filteredExpenses.length !== expenses.length`)
8. Update footer stats to also show filtered count when a filter is active

### Files Changed
- `src/pages/ProjectBudget.tsx` -- pass `filteredExpenses` prop
- `src/components/project/ExportReports.tsx` -- add fourth export option, new export function, updated grid layout




## Clickable "Need Attention" Badge to Filter Rows

### What Changes

Make the "X need attention" badge clickable in both import preview tables. Clicking it filters the table to show only rows with errors or unmatched categories, so you can fix them quickly. Clicking again (or clicking "X ready") clears the filter and shows all rows.

### Changes

#### 1. `src/components/project/ImportExpensesModal.tsx`

- Add a `filter` state: `useState<'all' | 'attention'>('all')`
- Compute `displayRows` based on the filter: when `'attention'`, show only rows where `hasError || !matchedCategory`; otherwise show all
- Make the "need attention" badge a clickable button with `cursor-pointer` styling; clicking it toggles the filter to `'attention'`
- Make the "ready" badge also clickable to reset filter to `'all'`
- Add a visual indicator (e.g. ring/underline) on the active filter badge
- Render `displayRows` in the table instead of `rows`, preserving the original row index for category assignment and numbering

#### 2. `src/components/QuickExpenseModal.tsx` (ImportTab)

- Same changes as above inside the `ImportTab` component's preview section (around lines 895-960)

### Technical Detail

```tsx
// New state
const [filter, setFilter] = useState<'all' | 'attention'>('all');

// Derived display rows (keeps original index for updateRowCategory)
const displayRows = filter === 'attention'
  ? rows.map((r, i) => ({ ...r, originalIdx: i })).filter(r => r.hasError || !r.matchedCategory)
  : rows.map((r, i) => ({ ...r, originalIdx: i }));

// Badges become clickable
<Badge
  variant="outline"
  className={`gap-1 text-success border-success cursor-pointer ${filter === 'all' ? 'ring-2 ring-success/30' : ''}`}
  onClick={() => setFilter('all')}
>
  <CheckCircle2 className="h-3 w-3" />{readyRows.length} ready
</Badge>

<Badge
  variant="outline"
  className={`gap-1 text-warning border-warning cursor-pointer ${filter === 'attention' ? 'ring-2 ring-warning/30' : ''}`}
  onClick={() => setFilter('attention')}
>
  <AlertTriangle className="h-3 w-3" />{needsAttention.length} need attention
</Badge>

// Table uses displayRows, with originalIdx for row numbering and category updates
{displayRows.map((row) => (
  <TableRow key={row.originalIdx} ...>
    <TableCell>{row.originalIdx + 1}</TableCell>
    ...
    // updateRowCategory(row.originalIdx, v) instead of idx
  </TableRow>
))}
```

### Files Changed
- `src/components/project/ImportExpensesModal.tsx` -- add filter state, clickable badges, filtered table
- `src/components/QuickExpenseModal.tsx` -- same changes in ImportTab's preview section

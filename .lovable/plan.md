## Goal

Make the project-type pills (**All Projects / Fix & Flips / Rentals / New Construction**) a **global filter for the entire Loans page** — so the stats row, donut chart, capital-stack bar chart, *and* table all respond together. Right now the pills only filter the table.

## UX decisions (no questions needed — defaults match the existing UI)

- **Scope of filter**: Stats row + Donut + Capital Stack + Table all filter together. One source of truth, one mental model.
- **Pill location**: Move the pill row out of `LoanTable` and place it **directly under the page header / above the Stats row** in `src/pages/Loans.tsx`. This makes it visually obvious it controls the whole page.
- **Loans with no linked project**: Hidden when any specific type is selected (they have no `project_type` to match). Visible under "All Projects".
- **Empty states**: If a type filter yields zero loans, the donut/bar charts hide naturally (existing `active.length === 0` guard) and the table shows its existing "No loans match your filters" row.
- **Status / project / search filters inside the table**: Stay inside `LoanTable` as secondary filters that compose on top of the page-level type filter.

## Technical changes

### 1. `src/pages/Loans.tsx`
- Add `projectTypeFilter` state (`'all' | 'fix_flip' | 'rental' | 'new_construction'`).
- Fetch `projects(name, project_type)` once via `useQuery`, keyed on `projectNames`, and build a `projectTypeByName` Map.
- Compute `visibleLoans = useMemo(...)` that filters `loans` by the selected type using that map.
- Render a new pill row (same styling as the current one in `LoanTable`) directly under the page header, above `<LoanStatsRow />`.
- Pass `visibleLoans` into `LoanStatsRow`, `LoanTable`, and `LoanCharts` (already done — just becomes filtered).

### 2. `src/components/loans/LoanTable.tsx`
- Remove the project-type pill row, `projectTypeFilter` state, and the `projectTypesRows` query (now lives on the page).
- Keep search, status, and project-name filters intact.
- Remove unused imports (`cn`, `LOAN_TYPE_COLORS` if no longer referenced).

### 3. `src/components/loans/LoanCharts.tsx`
- No code changes needed — it already derives all aggregates from the `loans` prop, so passing pre-filtered loans automatically filters the donut and bar chart.

## Pill row markup (unchanged from current implementation)

```tsx
<div className="flex flex-wrap gap-1.5">
  {PROJECT_TYPE_PILLS.map(pill => (
    <button
      key={pill.value}
      type="button"
      onClick={() => setProjectTypeFilter(pill.value)}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
        projectTypeFilter === pill.value
          ? 'bg-primary/15 text-primary border-primary/40'
          : 'bg-card text-muted-foreground border-border hover:text-foreground',
      )}
    >
      {pill.label}
    </button>
  ))}
</div>
```

## Result

Clicking **Fix & Flips** instantly recomputes the **Debt by Loan Type** donut, the **Capital Stack by Project** bars, the stats row totals, and the table rows — all in sync. UI stays clean: one pill row, one mental model.

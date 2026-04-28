## Goal

Reorder loan table columns to match the requested sequence:

**Project · Loan Purpose · Type · Balance · Monthly Pmt · Next Payment · Maturity · Status**

Currently the order is `Project · Loan Purpose · Type · Balance · Monthly Pmt · Maturity · Status · Next Payment` — so Next Payment needs to move from last to 6th position, and Status moves to last.

## Changes — `src/components/loans/LoanTable.tsx`

### 1. Header row (lines ~596–598)

```tsx
<TableHead className="text-center">Next Payment <SortBtn col="next_payment" /></TableHead>
<TableHead className="text-center">Maturity <SortBtn col="maturity_date" /></TableHead>
<TableHead className="text-center">Status <SortBtn col="status" /></TableHead>
```

### 2. Body row in `renderLoanRow` (lines ~291–293)

```tsx
<TableCell className="text-sm text-center">{formatDisplayDate(next)}</TableCell>
<TableCell className="text-sm text-center">{formatDisplayDate(loan.maturity_date)}</TableCell>
<TableCell className="text-center">
  <div className="flex justify-center"><LoanStatusBadge status={loan.status} /></div>
</TableCell>
```

### 3. Subtotal/grand-total rows

These use `colSpan` fillers. Total cell count is unchanged (8), so the existing `colSpan={3}` trailing filler still aligns — no edit needed.

## Out of Scope

- Card view, sort logic, filter dropdowns — unchanged.

## Files Touched

- `src/components/loans/LoanTable.tsx`

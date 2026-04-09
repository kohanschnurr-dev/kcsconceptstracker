

## Reorder Stats and Auto-size Grid

### Changes in `src/pages/LoanDetail.tsx`

**1. Reorder `summaryStats` array** — Move "Interest Accrued" to be the second item (right after Loan Amount):

```
[Loan Amount] [Interest Accrued] [Interest Rate] [Monthly Payment] [Remaining Term]
```

For traditional loans (with Outstanding Balance), the order becomes:
```
[Original Amount] [Interest Accrued] [Outstanding Balance] [Interest Rate] [Monthly Payment] [Remaining Term]
```

**2. Auto-size grid** — Change the grid from fixed `lg:grid-cols-6` to dynamically use the number of stats. Non-traditional loans have 5 stats → `lg:grid-cols-5`, traditional have 6 → `lg:grid-cols-6`. This ensures cards take proportional space.

### Files Modified
- `src/pages/LoanDetail.tsx` (~lines 117-124 for reorder, line 170 for grid)


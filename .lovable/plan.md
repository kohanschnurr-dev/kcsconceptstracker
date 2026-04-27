## Add sort to "Type" column and remove duplicate Type dropdown

Two small cleanups in **`src/components/loans/LoanTable.tsx`** to mirror the "Loan Name" sort affordance and de-clutter the filter row.

### Changes

1. **Add sort indicator to the Type header.** Replace `<TableHead>Type</TableHead>` (line 170) with `<TableHead>Type <SortBtn col="loan_type" /></TableHead>`. The existing `SortBtn` and sort logic already handle string columns via `localeCompare`, so no plumbing changes needed.

2. **Remove the Type `<Select>` dropdown** (lines 107-115). The chip-style "Quick type filters" row directly below it (`All Types | Private Money | Hard Money | DSCR…`) already controls the same `typeFilter` state and is more visual / one-tap. Keeping both is redundant clutter.

### Result

- Filter row shrinks to: Search • Status • Project (when applicable).
- Type filtering happens entirely through the chip row.
- Type column header gets the same up/down sort arrow that Loan Name has, so users can sort loans by type alphabetically.

No data, type, or routing changes. No other files affected.
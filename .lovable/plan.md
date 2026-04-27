## Goal

Make the Capital Stack chart breathe (less squished at the top) and add an **Accrued Interest** layer to each project's stack in a distinct color that isn't reused by any debt type.

## Changes — `src/components/loans/LoanCharts.tsx`

### 1. Taller chart + better vertical padding

- Increase `ResponsiveContainer` height from `290` → `380`.
- Increase top margin from `4` → `24` so the tallest bar isn't kissing the card edge.
- Bump bottom margin slightly (`70` → `78`) so rotated labels never clip.
- Add a small `Legend` underneath so users can see which color = which loan type (and the new Interest segment).

### 2. New "Interest" stack segment with a unique color

- Reserve a dedicated color not used by any `LoanType` in `LOAN_TYPE_COLORS`:
  - `INTEREST_COLOR = 'hsl(48, 100%, 70%)'` — a soft amber/yellow-gold. (Distinct from gold-orange `seller_financing` 45° at 47% L; this one is brighter and pushed to 48° / 70% L.) If too close in QA, fall back to `'hsl(60, 90%, 75%)'` pale yellow.
- Compute per-loan **accrued interest to date** using simple interest:
  ```
  accrued = balance × rate% × max(0, daysSince(start_date)) / 365
  ```
  where `balance = loanBalanceWithDraws(loan)` and `rate% = interest_rate / 100`.
  - Skip if `start_date` is in the future.
  - Aggregate per project into a new `__interest` key on each row.
- Add an extra `<Bar dataKey="__interest" stackId="capital" name="Interest Accrued" fill={INTEREST_COLOR} />` rendered **last** so it sits on top of the stack with the rounded `[4,4,0,0]` radius. The previous "last debt segment" loses its top radius (set to `0`).
- Tooltip already routes through `LOAN_TYPE_LABELS[name] ?? name`, so passing `name="Interest Accrued"` will display correctly. Total at bottom (debt + interest) is naturally shown via stack tooltip.

### 3. Header tweak

- Subtitle: `"Stacked by loan type"` → `"Debt + accrued interest, stacked by loan type"`.

## Technical Details

- Pure component-level change; no DB / type changes.
- Accrued interest is a derived display value; not persisted.
- Sorting of projects (`__total` desc) stays the same — based on debt only, so the chart ordering doesn't shuffle from interest.
- No changes to the Pie chart on the left (it stays "Debt by Loan Type" only).

## Files Modified

- `src/components/loans/LoanCharts.tsx`

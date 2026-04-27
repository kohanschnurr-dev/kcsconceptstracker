## Goal

Extend the **Debt by Loan Type** donut on the Loans dashboard so it visualizes accrued interest alongside principal, with a polished hover experience that breaks down each loan type's principal vs interest.

## Visualization model

- For each loan type present (e.g., Private Money, Hard Money, DSCR), produce **two slices**:
  - `{Type} — Principal` — current outstanding principal (existing value), full-saturation type color.
  - `{Type} — Interest` — current unpaid accrued interest for that type, same hue but lighter (reduced opacity / lighter HSL lightness) so it reads as a paired sibling.
- Slices are ordered so each type's principal and interest sit adjacent in the ring (Private Money principal → Private Money interest → Hard Money principal → Hard Money interest → …). This keeps the donut readable as "stacked pairs" rather than scattered colors.
- Interest slices with $0 are omitted (no zero-width wedges).

## Tooltip

Custom Recharts tooltip (replaces the default formatter) that, for any hovered slice, shows the loan type as a header and three rows:

```
Private Money
  Principal      $124,500
  Interest         $6,360
  ─────────────────────────
  Total          $130,860
```

- The same content shows whether the user hovers the principal slice or the interest slice — both belong to the same type.
- Styled with existing `TOOLTIP_STYLE` / `TOOLTIP_TEXT_STYLE` (popover bg, 1px border, sharp 2px corners per aesthetic standards).
- Uses `fmt()` (whole-dollar USD) for consistency with the rest of the chart.

## Legend

- Legend lists **only the loan types** (one entry per type), not the doubled slices, to avoid clutter. Each entry uses the type's full color swatch.
- Implemented by passing a custom `payload` prop to `<Legend>` derived from the unique types present.

## Center of donut

Per user direction: **no center text**. Existing empty center is preserved.

## Data computation

In `src/components/loans/LoanCharts.tsx`, replace the current `byType` memo with a richer structure:

```ts
// Per-type aggregates
type TypeAgg = { type: LoanType; label: string; principal: number; interest: number };
const aggByType: Record<string, TypeAgg> = {};

active.forEach(l => {
  const lp = paymentsByLoan[l.id] ?? [];
  const ld = drawsByLoan[l.id] ?? [];
  const principal = lp.length ? effectiveOutstandingBalance(l, lp) : loanBalanceWithDraws(l);
  const interest  = currentAccruedInterest(l, lp, ld);          // ledger-based, single source of truth
  const label = LOAN_TYPE_LABELS[l.loan_type] ?? l.loan_type;
  const agg = aggByType[label] ??= { type: l.loan_type, label, principal: 0, interest: 0 };
  agg.principal += principal;
  agg.interest  += interest;
});

// Flatten into pie rows, principal first then interest, per type, skipping zero interest.
const pieRows = Object.values(aggByType).flatMap(a => {
  const base = LOAN_TYPE_COLORS[a.type]?.hsl ?? LOAN_TYPE_COLORS.other.hsl;
  const rows = [{ key: `${a.label}|principal`, label: a.label, kind: 'principal', value: a.principal, color: base, agg: a }];
  if (a.interest > 0) {
    rows.push({ key: `${a.label}|interest`, label: a.label, kind: 'interest', value: a.interest, color: lightenHsl(base, 18), agg: a });
  }
  return rows;
});
```

`lightenHsl(hsl, delta)` is a small local helper that parses `hsl(h, s, l%)` and returns a new string with `l + delta` clamped to ≤90 — keeps the interest wedge clearly the same family but visibly secondary. No new dependencies.

## Files changed

- **`src/components/loans/LoanCharts.tsx`** — only file touched.
  - New `byType` shape (per-type aggregate of principal + interest).
  - Flatten to `pieRows` with paired slices.
  - Add `lightenHsl` helper.
  - Custom `<Tooltip content={...}>` component rendering the principal/interest/total breakdown.
  - Custom `payload` for `<Legend>` showing one entry per type.
  - Re-key the `<Pie>` to `dataKey="value"` over `pieRows` and re-color each `<Cell>` from `row.color`.

No changes to data fetching, types, or any other component. Calculation continues to use the unified `currentAccruedInterest` ledger so the donut, table column, and detail tile remain in lockstep.

## QA

- Hover each slice (principal and interest of the same type) → tooltip shows identical breakdown.
- Loan with $0 accrued interest (e.g., a brand-new loan) contributes only a principal wedge, no zero-width sliver.
- Legend remains clean (one entry per type), and dark-theme contrast is preserved.
- Numbers cross-check: sum of all principal slices = previous donut total; per-type interest matches the figure on each loan's detail tile.

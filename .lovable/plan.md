## Goal

Color the Loan Purpose pill by the loan's **type** instead of by the purpose string. So all hard-money loans look green, private-money purple, DSCR blue, etc. — regardless of what their purpose label says.

The existing `LOAN_TYPE_COLORS` palette already encodes this:

| Loan type        | Color  |
|------------------|--------|
| hard_money       | green  |
| private_money    | purple |
| dscr             | blue   |
| construction     | orange |
| conventional     | red    |
| seller_financing | yellow |
| heloc            | teal   |
| bridge           | pink   |
| portfolio        | indigo |
| other            | gray   |

The label inside the pill stays the purpose text (Working Capital, Construction, Purchase, etc.) — only the color changes.

## Changes

**`src/components/loans/LoanStatusBadge.tsx`**
- Update `LoanPurposeBadge` to accept `loanType: LoanType` (and keep `purpose` for the label). Look up the badge classes from `LOAN_TYPE_COLORS[loanType]` instead of `LOAN_PURPOSE_COLORS`.
- Remove the now-unused `getLoanPurposeColor` import in this file.

**`src/components/loans/LoanTable.tsx`**
- Both call sites (table cell + card view) — pass `loanType={loan.loan_type}` alongside the existing `purpose` prop.
- Card view's left-border color: switch from `getLoanPurposeColor(...).hsl` to `LOAN_TYPE_COLORS[loan.loan_type].hsl` so the border matches the pill.

**Other call sites**
- Search for any other `LoanPurposeBadge` usage and update those too (likely loan detail page header, comparison view).

## Cleanup

- `LOAN_PURPOSE_COLORS` and `getLoanPurposeColor` in `src/types/loans.ts` become dead code. Leave them for now (a one-line removal) unless nothing else references them — will check during implementation and remove if orphaned.

## Files

- `src/components/loans/LoanStatusBadge.tsx`
- `src/components/loans/LoanTable.tsx`
- Any other file rendering `<LoanPurposeBadge />` (verified during implementation)

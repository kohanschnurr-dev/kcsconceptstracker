## Recompute amortization start when loan start date changes

### Problem
When the user edits a loan's **Start Date**, the amortization schedule keeps showing the original dates. Two root causes:

1. **Stale `first_payment_date`**: On loan creation, `first_payment_date` is computed from `start_date` and saved. When the user edits `start_date` later, `AddLoanModal.handleSubmit` keeps the previously-saved `first_payment_date` (line 157: `form.first_payment_date || calcFirstPaymentDate(...)`), so the schedule keeps using the old anchor.
2. **UTC parsing bug**: `buildAmortizationSchedule` does `new Date(loan.first_payment_date ?? loan.start_date)` — a bare YYYY-MM-DD string is parsed as UTC, producing off-by-one days in US time zones (violates the project's date parsing standard).

### Changes

**`src/components/loans/AddLoanModal.tsx`** (handleSubmit, ~line 157)
- Detect whether `start_date` changed vs. the loaded loan. If it changed (or no `first_payment_date` exists), recompute `first_payment_date` from the new `start_date` + `payment_frequency` instead of preserving the stale value.
- Also recompute when `payment_frequency` changes.

**`src/types/loans.ts`** (`buildAmortizationSchedule`, ~line 445)
- Parse the start anchor with the safe `YYYY-MM-DD` + `T00:00:00` pattern (matching the existing pattern used elsewhere in this file and the project's date parsing standard) so dates don't drift by one day.

### Result
Editing the loan start date refreshes both `first_payment_date` and every row of the amortization table to the correct calendar dates.
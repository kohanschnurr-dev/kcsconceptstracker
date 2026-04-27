## Problem

Looking at the screenshot of the Treehouse/Wales loan:
- A **$58,000 payment** was logged but the **Loan Amount still reads $245,000** and **Interest Accrued ($5,954) hasn't budged**.
- Cause: in the Log Payment modal the **Principal / Interest** fields are optional. The user only filled in `Amount`. With `principal_portion = null`, `useLoans.addPayment` skips the `outstanding_balance` update entirely.
- Second issue: even when principal *is* recorded, the "Interest Accrued" stat (and the capital-stack interest segment) is computed by walking the amortization schedule from `start_date` on the *original* balance. It ignores payments completely, so future interest never re-bases on the new lower balance.

## Fix

### 1. Auto-split payments so balance always moves

In `PaymentHistoryTab.tsx` (Log Payment modal):
- When the user enters `Amount`, auto-compute a default split:
  - `interest_portion` = current accrued-but-unpaid interest on the loan, capped at the amount entered
  - `principal_portion` = remainder
- Show both fields pre-filled but still editable, with a small helper line: *"Interest first, remainder applied to principal. Edit to override."*
- Disable the Log Payment button if `principal + interest + late_fee` ≠ `amount` (with a small inline warning), so the math always reconciles.

### 2. Always reduce balance by the principal portion

In `useLoans.ts > addPayment`:
- If `principal_portion` is null/0 but `amount > 0`, fall back to treating the entire `amount` (minus `late_fee`) as principal so the balance still moves. This protects against legacy/imported payments.
- Clamp the new `outstanding_balance` at `0` (no negative balances).
- If the new balance hits `0`, also flip `loans.status` to `'paid_off'` automatically.
- Mirror the clamp/status logic in `deletePayment` (re-opening a paid-off loan when its final payment is removed).

### 3. Interest accrues on the *remaining* balance, not the original

Two places compute "interest accrued through today":

**a. `src/pages/LoanDetail.tsx`** — currently sums `schedule.interest` rows up to today. Replace with a payment-aware simple-interest accrual for short-term/interest-only loans:
```text
For each segment between payments (and from start_date → first payment, last payment → today):
  interest += balance_during_segment × rate × (days / 365)
balance_during_segment steps down by each payment's principal_portion.
totalInterestAccrued = Σ segment_interest − Σ payments.interest_portion
```
For amortizing loans (DSCR / conventional / HELOC / portfolio / seller financing) keep the schedule-based number but subtract `Σ payments.interest_portion` so the "Interest Accrued" stat shows what's still *owed*, not what's been paid.

**b. `src/components/loans/LoanCharts.tsx`** — the capital-stack `__interest` segment uses `bal × rate × days/365` from `start_date`. Switch to the same payment-aware accrual using each loan's `loan_payments` rows (already loaded for the loans page; if not, fetch alongside loans). Result: once a payment is logged, both the bar's principal segment *and* the gold interest segment shrink immediately.

### 4. UI polish on Loan Detail header

- "Loan Amount" stat label stays as the original/funded amount, but add a subtle secondary line under it: *"Remaining: $X"* when payments have reduced the balance. This avoids confusion where Loan Amount and Balance look unrelated.
- "Balance" stat = `effective outstanding balance + unpaid accrued interest` (both now payment-aware).
- "Mark Paid Off" remains, but is hidden once balance auto-flips to 0.

## Files Changed

- `src/components/loans/PaymentHistoryTab.tsx` — auto-split UX, reconciliation guard, helper text.
- `src/hooks/useLoans.ts` — fallback principal, clamp at 0, auto paid-off, mirror in delete.
- `src/pages/LoanDetail.tsx` — payment-aware interest accrual; "Remaining" subtitle on Loan Amount card.
- `src/components/loans/LoanCharts.tsx` — payment-aware accrual for the capital-stack interest segment (load `loan_payments` for active loans).
- `src/types/loans.ts` *(if needed)* — small helper `accruedInterestThroughToday(loan, payments)` used by both LoanDetail and LoanCharts to keep the math in one place.

## Question

One quick choice before I build:

**When a user types only an `Amount` in the Log Payment dialog, what's the default split you want?**
- **A. Interest-first (recommended)** — fill `interest_portion` with current unpaid accrued interest (capped at amount), rest goes to principal. Matches how lenders actually apply payments.
- **B. All principal** — assume every typed payment pays down the loan; only split when the user explicitly enters an interest portion. Simpler but understates true interest paid over time.
- **C. Always force the user to enter both** — no autofill; just block submit until principal + interest = amount.

I'll default to **A** unless you say otherwise.

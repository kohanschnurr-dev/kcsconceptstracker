

## Auto-Calculate Next Payment from Start Date + Payment Frequency

### Problem
The "First Payment Date" field is manually entered and optional, causing the "Next Payment" column to show "—" when not filled. The first payment should be automatically derived from the start/origination date plus one payment frequency period.

### Changes

**`src/components/loans/AddLoanModal.tsx`**
- Remove the "First Payment Date" input field (lines 400-403)
- Auto-compute `first_payment_date` when submitting: add one period (based on `payment_frequency`) to `start_date`
  - `monthly` / `interest_only` → +1 month
  - `quarterly` → +3 months
  - `annually` → +12 months
  - `bi_weekly` → +14 days

**`src/components/loans/LoanTable.tsx`**
- Update the "Next Payment" column: if `first_payment_date` is null, compute it from `start_date` + frequency instead of showing "—"
- Additionally, calculate the actual *next* payment by advancing from first payment date past today

**`src/types/loans.ts`**
- Add a small helper `calcFirstPaymentDate(startDate: string, frequency: string): string` that both the modal and table can use

### Summary
- 3 files changed
- Remove the manual "First Payment Date" field
- Auto-derive it from origination date + payment frequency
- "Next Payment" column will always show a meaningful date


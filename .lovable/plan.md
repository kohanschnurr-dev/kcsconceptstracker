## Fix: Balloon payment date should match the extended maturity date

### Problem
On a loan extended to **May 7**, the amortization table still shows the final balloon row dated **Apr 8** (the original month-day). `buildAmortizationSchedule` walks `start_date + N months`, so any extension that doesn't land on the original day-of-month is rendered incorrectly.

### Fix
Pin the **final/balloon row** to the actual effective maturity date (extension `extended_to`, falling back to `loan.maturity_date`).

### Files Changed

**`src/types/loans.ts`** — extend `buildAmortizationSchedule` signature:
```ts
buildAmortizationSchedule(loan, extensionMonths = 0, finalDateOverride?: string)
```
When `finalDateOverride` is provided AND the row is the last one (`i === term`), use that ISO date for the row's `date` (parsed as `new Date(dateStr + 'T00:00:00')` to avoid UTC off-by-one). All non-final rows continue to use the existing month-walk logic.

**`src/components/loans/AmortizationTable.tsx`** — accept and forward an optional `finalDate?: string` prop into `buildAmortizationSchedule`.

**`src/pages/LoanDetail.tsx`** — pass `finalDate={effectiveMaturity}` (already computed at line 75–77 as the latest `extended_to` or `loan.maturity_date`) into `<AmortizationTable />`. Both AmortizationTable invocations on the page get this.

### Result
The final row dated Apr 8 → **May 7**, matching the extension and the "Maturity Date" displayed in Loan Terms.



## Extend Draw Interest Dates to Include Extension Period

### Problem
`buildDrawInterestSchedule` uses `loan.maturity_date` as the end date for all draw interest periods. When extensions exist, draws should accrue interest until the **effective maturity** (original maturity + extensions), but currently they stop at the original maturity date.

### Changes

**`src/types/loans.ts`** — Add `extensionMonths` parameter to `buildDrawInterestSchedule`:
- Change signature to accept an optional `extensionMonths: number` parameter
- Compute effective maturity by adding `extensionMonths` to `loan.maturity_date`
- Use effective maturity for all draw period end dates and day calculations

**`src/pages/LoanDetail.tsx`** — Pass `extensionMonths` to the call:
- Line ~92: Change `buildDrawInterestSchedule(loan, draws)` to `buildDrawInterestSchedule(loan, draws, extensionMonths)`

**`src/components/loans/DrawScheduleTracker.tsx`** — If it calls `buildDrawInterestSchedule`, pass extension months there too.

### Files Modified
- `src/types/loans.ts` (signature + maturity calculation, ~3 lines changed)
- `src/pages/LoanDetail.tsx` (pass extensionMonths, 1 line)


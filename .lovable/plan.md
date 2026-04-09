

## Add Per-Draw Fees and Custom Interest Rate to Draw Schedule

### Problem
The draw schedule currently uses the loan-level interest rate for all interest calculations. The user wants to:
1. Set a custom interest rate per draw (override the loan rate)
2. Assign fees to each draw — either a flat dollar amount or a percentage of the draw amount

### Database Changes

**Migration: Add columns to `loan_draws` table**
- `fee_amount numeric` — flat fee in dollars (nullable)
- `fee_percentage numeric` — fee as % of draw amount (nullable)
- `interest_rate_override numeric` — per-draw interest rate override (nullable, falls back to loan rate)

### Code Changes

**1. `src/types/loans.ts`**
- Add `fee_amount`, `fee_percentage`, and `interest_rate_override` fields to `LoanDraw` interface
- Update `buildDrawInterestSchedule` to use per-draw `interest_rate_override` when available (falling back to loan rate)
- Add fee calculations to `DrawInterestPeriod` (include a `fees` field)
- Add `totalFees` to `DrawInterestResult`

**2. `src/components/loans/DrawScheduleTracker.tsx`**
- Add fee and interest rate fields to the **edit form** and **new draw form**: Interest Rate Override input, Fee $ input, Fee % input
- Display fees inline on each draw card (e.g., "Fee: $500" or "Fee: 2.0%")
- Add a "Fees" column to the interest accrual table
- Show total fees in the summary cards
- Compute effective fee: if both flat and % are set, use the larger; if only one, use that

**3. `src/pages/LoanDetail.tsx`**
- No changes needed — draws already pass through to the tracker component

### UI Behavior
- Each draw card shows the fee (if any) below the amount
- The interest accrual table gains a "Fees" column showing per-draw fees
- A new summary card shows "Total Draw Fees"
- Interest rate override appears as a small badge on the draw card (e.g., "@ 12%") when different from the loan rate


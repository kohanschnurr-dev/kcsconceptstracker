

## Fix: Differentiate Interest Calculation Methods Properly

### The Issue
Standard (30/360), Actual/360, and Actual/365 all produce the same monthly payment because the code computes the monthly rate as essentially `annual_rate / 12` for all three — the math is equivalent.

The real difference between these methods is **daily interest accrual per period**, which affects how much of each payment goes to interest vs. principal:

- **Standard (30/360)**: Every month = exactly 30 days. Monthly interest = `balance × rate / 12`
- **Actual/360**: Uses actual days in the month (28–31) over a 360-day year. Monthly interest = `balance × rate × actual_days / 360` — this means months with 31 days charge *more* interest, and Feb charges less. Over a year, total interest is slightly **higher** (~365/360 = 1.4% more).
- **Actual/365**: Uses actual days in the month over a 365-day year. Monthly interest = `balance × rate × actual_days / 365` — closest to true daily accrual.

### Changes

**File: `src/types/loans.ts`**

1. **`calcMonthlyPayment`** — For the estimated monthly payment display, keep Standard formula for all three amortizing methods (they target the same nominal payment). Add a comment explaining this is the nominal payment and that the per-period interest allocation differs in the amortization schedule.

2. **`buildAmortizationSchedule`** — This is where the real fix matters. Update the interest calculation inside the loop:
   - **Standard**: `interest = balance * rate / 12` (unchanged)
   - **Actual/360**: `interest = balance * rate * daysInMonth / 360`
   - **Actual/365**: `interest = balance * rate * daysInMonth / 365`
   
   Where `daysInMonth` is computed from the actual payment date's month.

3. Add a helper function `daysInMonth(date: Date): number` that returns the actual number of days.

This means:
- The **estimated monthly payment** shown in the modal stays the same across the three (correct — it's a target payment)
- The **amortization table** will show different interest/principal splits per row depending on method
- Actual/360 will show slightly higher total interest over the life of the loan

### Files to change
- `src/types/loans.ts` — Update `buildAmortizationSchedule` to use day-count-aware interest; add `daysInMonth` helper


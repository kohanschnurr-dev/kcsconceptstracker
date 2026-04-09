

## Fix Draw-Aware Interest Calculations & Per-Draw Rate Support

### Problem
Multiple issues with the current draw-based loan calculations:
1. **`LoanDraw` TypeScript interface** is missing `interest_rate_override`, `fee_amount`, and `fee_percentage` fields (they exist in the DB but not the type)
2. **`calcDrawAccruedInterest`** uses `loan.interest_rate` for all draws instead of per-draw `interest_rate_override`
3. **`calcDrawCurrentPayment`** same issue — ignores per-draw rates
4. **`buildDrawWeightedSchedule`** uses a single `loan.interest_rate / 100 / 12` for interest calc instead of per-draw rates
5. **Missing exports**: `buildDrawInterestSchedule`, `DrawInterestResult`, and `calcDrawFee` are imported in `DrawScheduleTracker.tsx` but don't exist in `loans.ts` — this is currently broken
6. **`totalCost` in LoanDetail.tsx** (line 81-85) still adds `drawnBalance` or `original_amount` to the cost, which contradicts the earlier change to exclude principal
7. **Interest Accrued stat** doesn't reactively update when draw amounts change because `calcDrawAccruedInterest` doesn't use per-draw rates

### Changes

**`src/types/loans.ts`**

1. Add `interest_rate_override`, `fee_amount`, `fee_percentage` to `LoanDraw` interface
2. Add `DrawInterestResult` interface and `buildDrawInterestSchedule` function — computes per-draw interest accrued using each draw's rate override (falling back to loan rate), plus total fees
3. Add `calcDrawFee` helper — returns the greater of flat fee or percentage-based fee for a draw
4. Update `calcDrawAccruedInterest` to use `draw.interest_rate_override ?? loan.interest_rate` per draw
5. Update `calcDrawCurrentPayment` to use per-draw rates for the monthly interest calculation
6. Update `buildDrawWeightedSchedule` to calculate interest per-draw at its own rate instead of a single global rate

**`src/pages/LoanDetail.tsx`**

1. Fix `totalCost` calculation — remove the `drawnBalance`/`original_amount` addition (should only be interest + fees, matching the earlier approved plan)
2. Use `buildDrawInterestSchedule` result for the Interest Accrued stat so it properly reflects per-draw rates and updates reactively
3. Use per-draw-weighted monthly payment for the "Current Interest Pmt" stat

**`src/components/loans/AmortizationTable.tsx`**

1. Update the draw-mode interest calculation in the summary to use per-draw rates from the schedule

### Key Logic

```typescript
// Per-draw interest rate resolution
function getDrawRate(draw: LoanDraw, loanRate: number): number {
  return (draw.interest_rate_override ?? loanRate) / 100;
}

// calcDrawAccruedInterest — fixed
draws.filter(funded).reduce((total, draw) => {
  const rate = getDrawRate(draw, loan.interest_rate);
  const days = daysSince(draw.date_funded);
  return total + draw.draw_amount * rate * (days / 365);
}, 0);

// calcDrawCurrentPayment — fixed  
draws.filter(funded).reduce((sum, draw) => {
  const rate = getDrawRate(draw, loan.interest_rate);
  return sum + draw.draw_amount * rate / 12;
}, 0);

// calcDrawFee
Math.max(draw.fee_amount ?? 0, draw.draw_amount * (draw.fee_percentage ?? 0) / 100)
```

### Files Modified
- `src/types/loans.ts`
- `src/pages/LoanDetail.tsx`
- `src/components/loans/AmortizationTable.tsx`


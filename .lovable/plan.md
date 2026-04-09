

## Add Draw Fees Line to Fees & Costs Breakdown

### What's Already Working
The draw system already supports per-draw interest rate overrides and draw fees (both flat $ and %) — the DB columns exist, the edit UI exists, and `buildDrawInterestSchedule` already uses them. The "Interest Accrual by Draw" table already shows per-period fees and rates.

### What's Missing
The **Fees & Costs** summary card on the Loan Detail page does not include a "Draw Fees" line, and draw fees are not factored into the "Total Cost of Loan" calculation.

### Changes

**`src/pages/LoanDetail.tsx`**
1. Compute `totalDrawFees` from `drawInterest.totalFees` (already calculated by `buildDrawInterestSchedule`)
2. Add a "Draw Fees" row in the Fees & Costs card (between Extension Fees and Interest Accrued), shown only when `totalDrawFees > 0`
3. Add `totalDrawFees` to the `totalCost` formula
4. For draw-based loans, use `drawInterest.totalInterest` instead of `totalScheduleInterest` for the "Interest Accrued" line, since draw-based interest is calculated differently (per-draw rates, cumulative balances)

### Code Summary
```typescript
// Line ~93: extract draw fees
const totalDrawFees = drawInterest?.totalFees ?? 0;

// Line ~90: include draw fees in total cost; use draw interest when applicable
const effectiveInterest = drawInterest ? drawInterest.totalInterest : totalScheduleInterest;
const totalCost = effectiveInterest + (loan.origination_fee_dollars ?? 0) + 
  (loan.other_closing_costs ?? 0) + totalExtensionFees + totalDrawFees;

// In Fees & Costs card, add row:
{totalDrawFees > 0 && <InfoRow label="Draw Fees" value={fmt(totalDrawFees)} />}

// Update Interest Accrued to use effectiveInterest
<InfoRow label="Interest Accrued" value={fmt(effectiveInterest)} />
```


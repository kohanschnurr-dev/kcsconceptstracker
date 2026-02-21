

## Align Project Report Profit with Financials Tab

### Problem
The Report and Financials tab use **different formulas**, producing different profit and ROI numbers:

| Factor | Financials (Calculator) | Report |
|---|---|---|
| Holding costs | PP x holdingPct% = $4,620 | (PP x pct / 12) x months = $385 |
| Loan interest | Not subtracted | Subtracted (~$744) |
| ROI denominator | PP + totalSpent | costBasis (PP + rehab + holding) |

These differences add up to thousands of dollars of discrepancy.

### Solution
Make the Report use the **exact same formula** as the ProfitCalculator:

**1. Use total holding costs in profit calc (not monthly x months)**

Replace the time-based holding in `costBasis` with the flat total holding cost, matching the Calculator's `purchasePrice * (holdingPct / 100)`.

```
// Before:
costBasis = pp + rehabCost + (holdPerMonth * holdPeriodMonths)

// After:
costBasis = pp + rehabCost + holdingCostsTotal
```

**2. Remove loan interest from profit**

The Calculator does not subtract loan interest, so the Report shouldn't either. Remove `loanCost` from the net profit calculation and drop the Loan Amount / Loan Rate rows from the deal table (they aren't part of the Calculator's output).

```
// Before:
netProfit = grossProfit - (loanCost ?? 0)

// After:
netProfit = grossProfit  // no loan deduction, matches Calculator
```

**3. Align ROI formula**

Calculator: `profit / (PP + totalSpent)`. Report: `netProfit / costBasis`. Switch the report to match.

```
// Before:
roi = netProfit / costBasis

// After:
roi = netProfit / (pp + rehabCost)  // matches Calculator's currentInvestment
```

### Technical Details

All changes are in `src/components/project/ProjectReport.tsx`, lines ~142-164:

- Line 142: Replace `holdPerMonth * holdPeriodMonths` with `holdingCostsTotal ?? 0` in the `costBasis` formula
- Line 153: Change `netProfit = grossProfit - (loanCost ?? 0)` to `netProfit = grossProfit`
- Lines 155-164: Simplify ROI to `netProfit / (pp + rehabCost) * 100`
- Remove the Loan Amount and Loan Rate `dealField` rows from the UI (~lines 396-399) since they aren't used in the profit calc

### Result
The Report's Net Profit and ROI will match the Financials tab exactly.

### Files Changed
- `src/components/project/ProjectReport.tsx`


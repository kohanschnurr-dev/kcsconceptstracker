

## Add "Equity Gain" to Rental Analysis

### What Changes
Add an **Equity Gain** metric to the Rental Cash Flow Analysis that mirrors the Fix & Flip profit formula: `ARV - Purchase Price - Rehab Budget - Transaction Costs - Holding Costs`. This shows the investor how much instant equity they capture by buying below market value and rehabbing.

### How It Works
- A new "Equity Gain" row appears in the **Returns** column of the Cash Flow Analysis grid
- A new **Equity Gain** summary card is added to the bottom summary row (expanding from 3 to 4 cards, matching the BRRR layout)
- The formula is: `ARV - Purchase Price - Total Budget - Closing Costs (Buy 2%) - Holding Costs (3%) - Selling Costs (6% if enabled)`
- Color coding: green if positive, red if negative

### Technical Details

**File: `src/components/budget/RentalAnalysis.tsx`**
1. Add new props: `closingCostsBuy`, `holdingCosts`, `closingCostsSell` (numbers)
2. Calculate `equityGain = arv - purchasePrice - totalBudget - closingCostsBuy - holdingCosts - closingCostsSell`
3. Add an "Equity Gain" row in the Returns section (below Cash Invested)
4. Add a 4th summary card at the bottom for Equity Gain (change grid from 3-col to 4-col)

**File: `src/pages/BudgetCalculator.tsx`**
1. Pass `closingCostsBuy`, `holdingCosts`, and `closingCostsSell` as additional props to `RentalAnalysis`


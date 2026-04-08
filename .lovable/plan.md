

## Add Origination Fee & Other Closing Costs to Loan Summary

### Problem
The linked loan card in the Project Loan tab doesn't surface origination fees or other closing costs in the summary stats row — only in the Overview tab's detail rows. The user wants these costs visible at a glance.

### Changes

**File: `src/components/project/ProjectLoanTab.tsx`**

1. **Add an "Origination Fee" stat** to the `summaryStats` array (after "Interest Paid"), showing `loan.origination_fee_dollars`. Use the `Landmark` icon with a relevant color.

2. **Add an "Other Closing Costs" stat** if `loan.other_closing_costs` is non-zero, showing that value.

3. **Add a "Total Loan Cost" stat** that sums: original amount + total interest paid + origination fee + other closing costs — giving a clear picture of the all-in cost of the loan. This mirrors the "Total Cost of Loan" metric already shown in the `AmortizationTable` component.

4. **Also show `other_closing_costs`** in the Overview tab's right column (currently only origination fee is shown there on line 143).

5. Adjust the stats grid from `lg:grid-cols-6` to accommodate the extra items cleanly (use `lg:grid-cols-4` with wrapping, which is more readable).


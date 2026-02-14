
## Split Financials into Two Tabs for Rental Projects

### What Changes
For **rental projects only**, the single "Financials" tab will be split into two separate tabs:
- **Financials** -- the Profit Calculator (Purchase Price, ARV, Transaction/Holding costs, profit breakdown)
- **Cash Flow** -- the Cash Flow / Refi Calculator (rent, refi details, expenses, cash-on-cash ROI)

Non-rental projects (Fix & Flip, New Construction, Wholesaling) remain unchanged with a single "Financials" tab showing the Profit Calculator.

### Technical Changes

**`src/pages/ProjectDetail.tsx`**

1. **Add "cashflow" to the tab system**:
   - Add `cashflow` to `DEFAULT_DETAIL_TAB_ORDER` (after `financials`)
   - Add `cashflow: 'Cash Flow'` to `TAB_LABELS`

2. **Conditionally show/hide tabs based on project type**:
   - When rendering `TabsTrigger` items, skip `cashflow` for non-rental projects
   - For rental projects, show both `financials` and `cashflow` tabs

3. **Update the "financials" TabsContent**:
   - Currently it conditionally renders `CashFlowCalculator` for rentals vs `ProfitCalculator` for others
   - Change it to **always** render `ProfitCalculator` (the rental version will also get the profit calculator here)
   - Move `ExportReports` to stay within this tab

4. **Add a new "cashflow" TabsContent**:
   - Render the `CashFlowCalculator` component (currently shown for rentals under financials)
   - Only relevant for rental projects

5. **Filter tab order in `effectiveTabOrder` memo**:
   - For non-rental projects, filter out `cashflow` from the order
   - For rental projects, include both `financials` and `cashflow`

This approach keeps the tab reordering system working correctly since both tabs exist in the order array and labels map.



## Make Cash Flow Result Cards Clickable with Breakdown

### What Changes
The three result cards -- Monthly Cash Flow, Annual Cash Flow, and Cash-on-Cash ROI -- will become clickable. Clicking any of them will expand/toggle a breakdown panel showing the line-by-line math behind that number.

### Breakdown Content

**Monthly Cash Flow breakdown:**
- Gross Rent: (monthly rent amount)
- Vacancy Allowance: -(vacancy % of rent)
- Effective Income: (rent minus vacancy)
- Mortgage P&I: -(monthly mortgage)
- Property Taxes: -(annual / 12)
- Insurance: -(annual / 12)
- HOA: -(annual / 12)
- Maintenance: -(monthly amount)
- Management Fee: -(management % of rent)
- **= Monthly Cash Flow**

**Annual Cash Flow breakdown:**
- Monthly Cash Flow x 12
- Shows the same items annualized

**Cash-on-Cash ROI breakdown:**
- Annual Cash Flow: (amount)
- Total Investment: Purchase Price + Rehab Spent
- Loan Amount: -(refi amount)
- Cash Left in Deal: (total investment minus loan)
- **= Annual Cash Flow / Cash in Deal**

### Technical Details

**File: `src/components/project/CashFlowCalculator.tsx`**

1. Add a state variable `expandedCard` (`'monthly' | 'annual' | 'roi' | null`) to track which card's breakdown is visible
2. Make each of the three result card `div`s clickable with `cursor-pointer` and an `onClick` that toggles `expandedCard`
3. Add a `Collapsible`-style panel below each card (or below the row) that renders when that card is selected, showing the itemized math in a clean two-column layout (label on left, amount on right)
4. Use existing calculated values (`monthlyTaxes`, `monthlyInsurance`, `monthlyHoa`, `managementFee`, `vacancyAllowance`, `monthlyMortgage`, `grossMonthlyIncome`, `cashInvested`, etc.) -- no new calculations needed
5. Style the breakdown with the same `bg-muted/30` treatment used in the Summary section, with a subtle border to connect it to the clicked card

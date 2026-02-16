

## Add Budget Planner Types: Fix & Flip, Rental, and BRRR

### What Changes
The Budget Calculator (currently Fix & Flip only) will support three strategy modes -- **Fix & Flip**, **Rental**, and **BRRR** -- selectable via a segmented control at the top of the Deal Parameters sidebar. Each mode shares the same budget canvas but has tailored sidebar fields and profit/financial analysis.

### How It Works

**Type Selector**
- A 3-button segmented toggle (Fix & Flip | Rental | BRRR) at the top of the Deal Parameters sidebar, above "Purchase Price"
- Switching type updates sidebar fields and bottom analysis section; budget canvas values are preserved
- Selected type is stored in component state (and optionally saved with templates)

**Fix & Flip (current behavior, no changes)**
- Sidebar: Purchase Price, ARV, Square Footage, Estimated Costs (closing/holding)
- Analysis: Profit Breakdown (acquisition, rehab, sale, ROI)
- MAO gauge in header

**Rental (new)**
- Sidebar: Purchase Price, ARV, Square Footage, Monthly Rent, Vacancy Rate, Operating Expenses (taxes, insurance, HOA, maintenance, management fee), Refi toggle (loan amount, rate, term)
- Analysis: Cash Flow Analysis (monthly/annual cash flow, cap rate, cash-on-cash return)
- MAO gauge remains visible but less emphasized

**BRRR (new)**
- Sidebar: All Fix & Flip fields PLUS all Rental fields (monthly rent, vacancy, operating expenses) PLUS Refinance section (refi loan amount, rate, term -- representing the post-rehab refinance)
- Analysis: Combined view -- Rehab profit metrics (equity captured) AND post-refi cash flow projections, cash-on-cash return, money-left-in-deal calculation

### Technical Details

**File: `src/components/budget/DealSidebar.tsx`**
1. Add `calculatorType` and `onCalculatorTypeChange` props (type: `'fix_flip' | 'rental' | 'brrr'`)
2. Add a segmented `Tabs` control at the top of the sidebar with 3 options
3. Conditionally render fields based on type:
   - `fix_flip`: current fields (no change)
   - `rental`: replace ARV label context, add Monthly Rent, Vacancy %, Operating Expenses section, Refi toggle section
   - `brrr`: show all fix-flip fields + rental income/expenses + refi section
4. New state fields for rental-specific inputs: `monthlyRent`, `vacancyRate`, `annualTaxes`, `annualInsurance`, `annualHoa`, `monthlyMaintenance`, `managementRate`, `refiLoanAmount`, `refiRate`, `refiTerm`

**File: `src/pages/BudgetCalculator.tsx`**
1. Add `calculatorType` state, default `'fix_flip'`
2. Pass type to `DealSidebar` and lift new rental/BRRR field values up
3. Add new state variables for the rental/BRRR-specific inputs
4. Update the Profit Breakdown section to render different analysis based on type:
   - `fix_flip`: current profit analysis (unchanged)
   - `rental`: cash flow analysis (NOI, cap rate, cash-on-cash, monthly/annual cash flow)
   - `brrr`: equity captured + post-refi cash flow + money left in deal
5. Update `handleSave` and template loading to persist/restore the calculator type
6. Update subtitle text to reflect active mode

**Financial Formulas**

Rental Analysis:
- Gross Monthly Income = Monthly Rent x (1 - Vacancy Rate)
- Monthly Operating Expenses = (Taxes + Insurance + HOA + Maintenance) / 12 + Management Fee
- NOI = (Gross Annual Income) - (Annual Operating Expenses)
- Cap Rate = NOI / (Purchase Price + Rehab)
- Monthly Cash Flow = Gross Monthly Income - Operating Expenses - Mortgage P&I
- Cash-on-Cash = Annual Cash Flow / Total Cash Invested

BRRR Analysis:
- All rental formulas above, plus:
- Equity Captured = ARV - Refi Loan Amount
- Money Left in Deal = (Purchase + Rehab + Closing) - Refi Loan Amount
- Cash-on-Cash = Annual Cash Flow / Money Left in Deal

**Template persistence** (budget_templates table):
- Store `calculator_type` in the existing `category_budgets` JSONB field (as a `_meta.type` key) to avoid a migration, OR add a column if preferred -- the JSONB approach keeps it simpler


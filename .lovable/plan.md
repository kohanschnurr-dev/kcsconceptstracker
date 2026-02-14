
## Make Refi Section Toggleable and Reorder Layout

### What Changes
The "Refi Details" section becomes an on/off toggle. When off, the section collapses. The Refi section (inputs + analysis) moves to sit between Expenses and the Cash Flow results, keeping it as its own distinct block.

### Layout Order (New)
1. Property Details (Purchase Price, ARV, Monthly Rent)
2. Rehab Budget
3. Expenses (Taxes, Insurance, HOA, Maintenance, Vacancy, Management)
4. **Refi Section** (toggle on/off) -- contains Refi Details inputs + Refi Analysis results
5. Monthly/Annual Cash Flow + Cash-on-Cash ROI results
6. Breakdown panels
7. Summary bar

### Technical Changes

**`src/components/project/CashFlowCalculator.tsx`**

1. **Add a `refiEnabled` state** (default: `true` if `loanAmount > 0`, else `false`):
   ```tsx
   const [refiEnabled, setRefiEnabled] = useState(initialLoanAmount > 0);
   ```

2. **Move Refi Details + Refi Analysis into a single collapsible block** between Expenses and the Results grid:
   - Header row: "REFI / LOAN" label with a `Switch` toggle
   - When toggled ON: show Loan Amount, Interest Rate, Loan Term inputs + the Refi Analysis cards (Refi Loan Amount, Cash Out at Refi, Equity in Property)
   - When toggled OFF: collapse/hide all refi inputs and analysis using Collapsible

3. **When Refi is OFF, calculations treat loan as 0**:
   - `effectiveLoanAmount` becomes `refiEnabled ? loanAmount : 0`
   - Cash-on-Cash ROI calculates as all-cash deal
   - Monthly mortgage = 0

4. **Move the Rehab Budget section** up to sit right after Property Details (before Expenses)

5. **Reorder sections**: Property Details -> Rehab Budget -> Expenses -> Refi (collapsible) -> Results -> Breakdowns -> Summary

### Files to Change
- **`src/components/project/CashFlowCalculator.tsx`** -- reorder sections, add refi toggle with Collapsible wrapper, update `effectiveLoanAmount` to respect toggle state

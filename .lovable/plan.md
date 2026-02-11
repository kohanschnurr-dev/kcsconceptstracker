

## Fix & Flip to Rental Conversion -- Analysis and Improvements

### What currently transfers well
- **All project data** -- name, address, start date, cover photo, property info
- **All expenses and budget categories** -- every expense record stays intact and linked
- **Documents, photos, daily logs, tasks, vendors** -- all untouched
- **Purchase price and ARV** -- carried over (used by Cash Flow calculator too)
- **Tabs** -- the Loan tab is automatically hidden for rentals; Financials switches from Profit Calculator to Cash Flow/Refi Calculator
- **Project card** -- icon switches to Home, budget progress bar is hidden, shows "Total Expenses" instead

### What does NOT transfer well (issues to fix)

1. **Status forced to "active"** -- The conversion sets status to `'active'` regardless of current status. If the project is `'complete'` (which is the only time the button appears), this is intentional. This is fine.

2. **No confirmation dialog** -- Clicking "Convert to Rental" executes immediately with no undo. For a significant action like this, a confirmation dialog would prevent accidental clicks.

3. **Cash Flow calculator starts blank** -- After converting, the Financials tab switches to the Cash Flow/Refi calculator, but fields like Monthly Rent, Loan Amount, Interest Rate, Insurance, Property Taxes, HOA, Vacancy, Maintenance, and Management Rate all start at 0 or defaults. This is expected since a flip wouldn't have rental-specific data, but it could be jarring. A toast or inline hint reminding you to fill in rental details would help.

4. **Projects page tab** -- The project moves from the "Fix & Flips" tab to the "Rentals" tab on the Projects page. This is correct behavior but could be surprising if you're looking for it in the old tab.

5. **No way to convert back** -- Once converted to rental, there's no UI to revert to fix_flip. This may be intentional but worth noting.

### Plan: Add a confirmation dialog before converting

**File: `src/pages/ProjectDetail.tsx`**

- Wrap the "Convert to Rental" action with an `AlertDialog` confirmation
- Dialog message: "This will convert {project name} to a rental property. The Financials tab will switch to the Cash Flow calculator, and the Loan tab will be hidden. This can't be undone."
- Confirm button: "Convert to Rental"
- After successful conversion, show a toast that also reminds: "Head to the Financials tab to set up your rental income details."

**No database changes needed.** The conversion logic itself (just updating `project_type`) is sound -- all data is preserved. The only gap is UX guardrails.


# Budget Calculator PDF Export

Add a one-click branded PDF export to the Budget Calculator so the current deal on screen can be shared with wholesalers exactly as you see it.

## What gets added

An **Export PDF** button in the Budget Calculator header, next to Import and Clear All. Clicking it opens the browser print/save dialog with a print-ready deal sheet. Nothing is saved to the backend.

## What the PDF shows

Header: your company name and logo (from Company Settings), the budget/deal name, and the prepared-on date.

Deal Snapshot cards: Purchase Price, ARV, Square Footage, Total Construction Budget, and $/sqft.

MAO section: MAO percentage, the calculated max allowable offer, and how the current purchase price compares (over/under).

Construction Budget table: every category with a value entered, its amount, its percent of total budget, and a bolded total row. Empty categories are skipped.

Analysis section, matching the calculator mode you are in:
- Fix & Flip: full profit breakdown — ARV, purchase, construction, closing costs, holding costs, selling closing costs, net profit, ROI, and profit margin.
- Rental: rent, vacancy, operating expenses, NOI, monthly and annual cash flow, cash-on-cash, cap rate, plus loan terms.
- BRRRR: the refinance/money-left-in-deal figures the on-screen panel shows.

Footer: generated timestamp.

## Design

Matches the existing Cash Flow and Scope of Work PDF templates — clean white print layout, Plus Jakarta Sans, gold accents, tabular numbers, positive/negative color coding. Prints cleanly on one page for typical deals, with page-break protection on the table.

## Technical notes

- New file `src/lib/budgetPdfExport.ts` exporting `generateBudgetPdf(data)`, modeled on `src/lib/cashFlowPdfExport.ts` (HTML blob opened in a new window with an auto-print script, which avoids ad-blocker issues per the existing PDF export approach).
- `src/pages/BudgetCalculator.tsx` builds the data object from its existing state (`purchasePrice`, `arv`, `sqft`, `categoryBudgets`, `maoPercentage`, cost pct/flat modes, `rentalFields`, `calculatorType`) and the derived totals already computed there — no calculation logic is duplicated or changed.
- Branding pulled from `useCompanySettings()`.
- Button disabled with a tooltip until at least one category budget or purchase price is entered.

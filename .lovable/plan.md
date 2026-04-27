## Fix

Remove the **Portfolio / By Project** toggle from `src/pages/Loans.tsx` and collapse the page to a single always-on Portfolio view.

Specifically:
- Delete the toggle button group (lines ~74–92).
- Delete the `view` / `ViewMode` state.
- Delete the conditional **Project selector** dropdown that only appeared in "By Project" mode (lines ~108–122). The loans table already shows the project column and the Charts already group by project, so the standalone filter is redundant.
- Always render `<LoanCharts loans={visibleLoans} />` (drop the `view === 'portfolio'` gate).
- Remove now-unused imports (`Select*` if nothing else uses them, `selectedProject` state, `projectNames` if only used here — keep it if `LoanTable` still needs it).

Header right-side action row becomes just **Compare** + **Add Loan**, matching the screenshot you sent.

## Files Changed

- `src/pages/Loans.tsx` — remove toggle, project selector, and `view` state; always show Charts.

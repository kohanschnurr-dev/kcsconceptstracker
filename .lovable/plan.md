
## Export Popup on Budget Page

### Problem
The "Export" button on the Budget page immediately downloads a basic CSV. The user wants it to open a popup with 3 export choices (Expenses CSV, Budget Summary, Full Report) -- similar to the `ExportReports` card that currently lives under the Financials tab where it doesn't belong.

### Solution
1. Replace the direct `exportToCSV` call with a dialog/popover that shows the 3 export options from `ExportReports`.
2. Remove the `ExportReports` card from the Financials tab (`ContractorFinancialsTab.tsx`) and the Project Detail page (`ProjectDetail.tsx`) since it belongs here on the Budget page.

### Changes

**`src/pages/ProjectBudget.tsx`**
- Add state `exportModalOpen` to control a Dialog
- Replace `onClick={exportToCSV}` on the Export button with `onClick={() => setExportModalOpen(true)}`
- Add a `<Dialog>` that renders the `<ExportReports>` component inside it, passing the current project, categories, and expenses data
- Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` and `ExportReports`
- The existing `exportToCSV` function can remain as a fallback or be removed (the ExportReports component has its own export logic)

**`src/components/project/ContractorFinancialsTab.tsx`**
- Remove the `<ExportReports>` section and its import since it's moving to the Budget page export button

**`src/pages/ProjectDetail.tsx`**
- Remove the `<ExportReports>` section and its import from the Financials tab area

### Result
Clicking "Export" on the Budget page opens a clean dialog with the 3 export type cards (Expenses CSV, Budget Summary, Full Report). The redundant export section is removed from the Financials tab.

### Files Changed
- `src/pages/ProjectBudget.tsx` -- add export dialog with ExportReports component
- `src/components/project/ContractorFinancialsTab.tsx` -- remove ExportReports usage
- `src/pages/ProjectDetail.tsx` -- remove ExportReports usage



## Project Report Page for Fix and Flip Projects

### Overview

Create a new `ProjectReport` component that renders a comprehensive, print-friendly financial report for a project. It will be accessible via a "Generate Report" button in the project header area (next to the edit/delete icons). The report opens as a full-page modal/dialog and is fully theme-aware -- all colors come from CSS variables, never hardcoded.

### Sections Included

1. **Project Header** -- Name, address, status badge, start date, report generation date
2. **Financial Snapshot** -- 4 stat cards: Total Budget, Total Spent, Remaining (green/red), ROI % (estimated from ARV/purchase price)
3. **Budget Progress Bar** -- Visual bar with threshold coloring (green <85%, yellow 85-100%, red >100%)
4. **Category Spend Breakdown** -- Horizontal bars per category showing spent vs budget, using existing category data
5. **Timeline Summary** -- Start date, projected end date (if available via completed_date), days elapsed, days remaining
6. **Recent Activity Log** -- Last 10 expense entries in a clean table (Date, Vendor, Category, Amount)
7. **Team Summary** -- Vendors/contractors with total paid to each, aggregated from expense data

### Design

- All colors use CSS variables (`hsl(var(--primary))`, `hsl(var(--success))`, etc.)
- Clean card-based layout matching the existing app aesthetic
- Print button triggers `window.print()` with `@media print` optimizations
- Download PDF button reuses the existing `generatePDF` utility from `src/lib/pdfExport.ts`

### Technical Details

**New file: `src/components/project/ProjectReport.tsx`**

A self-contained component that receives:
- `project` (DB project object)
- `categories` (with `actualSpent`)
- `expenses` (all project expenses)
- `open` / `onOpenChange` (dialog control)

Renders inside a `Dialog` with `max-w-4xl` width. Sections use existing `Card`, `Badge`, `Progress` components. Category bars are simple themed divs (no chart library needed). The vendor aggregation groups expenses by `vendor_name` and sums amounts.

The "Print" button opens the report as a standalone HTML page via `generatePDFHtml` with a new doc type `'Project Report'`, inheriting the theme-aware PDF system. Alternatively a simpler `window.print()` on the dialog content is provided.

**Modified file: `src/pages/ProjectDetail.tsx`**

- Import `ProjectReport` component
- Add state: `const [reportOpen, setReportOpen] = useState(false)`
- Add a "Generate Report" button (FileText icon) in the header row next to the edit/delete icons (~line 786-801)
- Render `<ProjectReport>` with the existing `project`, `categories`, `allExpensesForExport` data

**Modified file: `src/lib/pdfExport.ts`**

- Add `'Project Report'` to the `PdfOptions` docType union and icon map

### Files Changed

- `src/components/project/ProjectReport.tsx` -- new component with all 7 report sections
- `src/pages/ProjectDetail.tsx` -- add Generate Report button + render the report dialog
- `src/lib/pdfExport.ts` -- extend docType to include 'Project Report'


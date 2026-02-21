

## Make the PDF a One-Pager

### Goal
Match the reference screenshot: the PDF should contain only the **Header**, **Budget Snapshot**, and **Deal Financials & ROI** sections -- no donut chart, no category breakdown, no scope creep. Also fix the remaining white background override.

### Changes in `src/components/project/ProjectReport.tsx`

**1. Exclude extra sections from the PDF export (handleDownloadPdf, ~line 193)**

The `handleDownloadPdf` function clones the full `reportRef.current.innerHTML`. Instead of cloning everything, we will:
- Clone the report ref's DOM into a temporary container
- Remove the 4th section (Where the Money Went), 5th section (Category Breakdown), and 6th section (Scope Creep) from the clone before extracting innerHTML
- This keeps the modal preview unchanged while producing a condensed one-page PDF

**2. Tighten spacing for single-page fit**

In the PDF HTML template:
- Reduce outer padding from `px-8 py-8 space-y-8` to `px-6 py-4 space-y-4`
- Reduce `@page` margin from `0.5in` to `0.3in`
- Reduce section `margin-bottom` in print CSS from `12px` to `6px`

**3. Fix the second white background override (line 677)**

The inline `<style>` block at line 677 still has `body { background: white !important; }`. Change it to use the theme variable: `body { background: hsl(var(--background)) !important; }`

### Summary of Sections in PDF

| Section | Included in PDF? |
|---------|-----------------|
| Header (company, project name, status) | Yes |
| Budget Snapshot (4 stat cards + usage bar) | Yes |
| Deal Financials and ROI | Yes |
| Where the Money Went (donut) | No -- removed |
| Category Breakdown (bar chart) | No -- removed |
| Scope Creep / Unbudgeted | No -- removed |
| Footer | Yes |

### Files Changed
- `src/components/project/ProjectReport.tsx` -- filter sections in PDF export, tighten spacing, fix background


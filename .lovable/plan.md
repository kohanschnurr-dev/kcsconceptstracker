

## Remove "Contractor · Builder" Subtitle from Invoice and Scope of Work PDFs

Remove the hardcoded "Contractor · Builder" line from both document templates in `src/lib/pdfExport.ts`.

### Changes in `src/lib/pdfExport.ts`
1. **Line 671** — Delete `<div class="company-role">Contractor &middot; Builder</div>` from the Invoice template
2. **Line 945** — Delete `<div class="company-role">Contractor &middot; Builder</div>` from the Scope of Work template

Two single-line deletions in one file.


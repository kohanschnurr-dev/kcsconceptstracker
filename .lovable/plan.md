

## Split Invoice into Two Buttons: Generate PDF + Save to Project

### Problem
Currently the single "Generate Invoice PDF" button does both things at once -- opens the PDF and saves to the selected project. The user wants these as separate actions so they can preview/download the PDF without necessarily saving it.

### Changes

**`src/components/project/GenerateInvoiceSheet.tsx`**

1. **Split `handleGenerate` into two functions:**
   - `handleGeneratePDF()` -- only builds the text content and calls `generatePDF()` to open in a new tab. No saving.
   - `handleSaveToProject()` -- builds the same content, generates the HTML via `generatePDFHtml()`, and calls `saveDocumentToProject()`. Shows toast on success/failure.

2. **Update the button area (lines 409-413):**
   - Keep "Generate Invoice PDF" button -- calls `handleGeneratePDF()` only. Always enabled.
   - Add a second "Save to Project" button below it -- only visible when a project is selected (`selectedProjectId` is set). Calls `handleSaveToProject()`. Shows the `isSaving` spinner state. Uses `outline` variant with a download/save icon to visually distinguish it.

3. **Helper text update (line 405):**
   - Change to: "Optional -- select a project to enable saving a copy to its Documents tab"

### Result
- "Generate Invoice PDF" always just opens the PDF preview
- "Save to Project" button appears only when a project is chosen, confirming the save action separately

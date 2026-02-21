

## Split Receipt Generator into Two Buttons: Generate PDF + Save to Project

### Problem
The Receipt Generator still has a single "Generate Receipt PDF" button that both opens the PDF and saves to the selected project. The Invoice Generator was already split into separate actions, but the same change needs to be applied here.

### Changes

**`src/components/project/GenerateReceiptSheet.tsx`**

1. **Refactor `handleGenerate` into three functions** (same pattern as Invoice):
   - `buildContent()` -- assembles the receipt text lines and returns the joined string
   - `getPdfOptions()` -- returns the PDF options object
   - `handleGeneratePDF()` -- calls `generatePDF(buildContent(), getPdfOptions())` only
   - `handleSaveToProject()` -- generates the HTML, calls `saveDocumentToProject()`, shows toast

2. **Update the button area at the bottom:**
   - "Generate Receipt PDF" button calls `handleGeneratePDF()` only, always enabled
   - New "Save to Project" button (outline variant) appears only when a project is selected, calls `handleSaveToProject()`, shows saving state

3. **Update helper text:**
   - Change from "Optional -- saves a copy to the project's Documents tab" to "Optional -- select a project to enable saving a copy to its Documents tab"

### Technical Details

Lines affected in `GenerateReceiptSheet.tsx`:
- Lines ~107-152: Split `handleGenerate` into `buildContent`, `getPdfOptions`, `handleGeneratePDF`, and `handleSaveToProject`
- Lines ~247-251: Replace single button with two-button layout
- Line ~244: Update helper text

No other files affected. No database changes.

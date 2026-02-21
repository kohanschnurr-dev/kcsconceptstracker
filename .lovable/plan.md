

## Split Scope of Work into Two Buttons (Generate PDF + Save to Project)

The Invoice and Receipt generators already have the split-button pattern. The Scope of Work sheet still uses the old combined approach. This plan applies the same refactor.

### Changes

**`src/components/vendors/ScopeOfWorkSheet.tsx`**

1. **Refactor `handleGenerate` (lines 104-188) into separate functions:**
   - `buildContent()` -- assembles the text lines and returns the joined string (lines 105-163 logic)
   - `getPdfOptions()` -- returns `{ docType, companyName, logoUrl }` (lines 164-168 logic)
   - `handleGeneratePDF()` -- calls `generatePDF(buildContent(), getPdfOptions())` only
   - `handleSaveToProject()` -- async function that generates HTML via `generatePDFHtml()`, calls `saveDocumentToProject()`, shows toast on success/failure

2. **Update helper text (line 352):**
   - Change to: "Optional -- select a project to enable saving a copy to its Documents tab"

3. **Replace single button with two buttons (lines 356-365):**
   - "Generate Scope of Work PDF" button calls `handleGeneratePDF()` only, always enabled
   - New "Save to Project" button (outline variant) appears only when `selectedProjectId` is set, calls `handleSaveToProject()`, shows saving state

### No other files need changes
Invoice and Receipt are already updated.




## Add Project Assignment and Auto-Save to Documents for All 3 PDF Generators

### What Changes

All three document generators (Invoice, Receipt, Scope of Work) will get an optional "Save to Project" selector. When a project is selected, the generated PDF (as an HTML file) will automatically be uploaded to that project's Documents storage and a record inserted into `project_documents`. A success toast confirms the action. The PDF still opens in a new tab for printing as before.

### How It Works

1. Each generator sheet gets a new "Save to Project" section at the bottom, just above the Generate button
2. The section uses the existing `ProjectAutocomplete` component (already built and used elsewhere)
3. Projects are fetched on mount from the `projects` table
4. When "Generate" is clicked:
   - The PDF opens in a new tab for printing (existing behavior, unchanged)
   - If a project is selected, the HTML blob is also uploaded to `project-documents` storage and a `project_documents` record is inserted
   - A toast confirms: "Document saved to [Project Name]"
5. The project selector is optional -- if no project is selected, it works exactly as before

### Technical Details

**`src/lib/pdfExport.ts`**

1. Refactor `generatePDF` to also return the HTML string so callers can use it for upload
2. Add a new exported helper `generatePDFHtml(content, options): string` that builds the HTML without opening a window
3. Keep `generatePDF` calling `generatePDFHtml` internally then opening the blob URL as before

**`src/components/project/GenerateInvoiceSheet.tsx`**

1. Add imports: `supabase`, `ProjectAutocomplete`, `useToast`, `useAuth`
2. Add state: `selectedProjectId`, `projects[]`, `isSaving`
3. Add `useEffect` to fetch projects on mount
4. Add a "Save to Project" section with `ProjectAutocomplete` before the Generate button
5. Update `handleGenerate`:
   - Call `generatePDFHtml` to get the HTML string
   - Open in new tab (existing behavior)
   - If `selectedProjectId` is set, upload blob to `project-documents` storage and insert into `project_documents` table with category `'invoice'`
   - Show success toast with project name

**`src/components/project/GenerateReceiptSheet.tsx`**

Same pattern as Invoice:
1. Add project selector state and fetch
2. Add "Save to Project" section in the UI
3. On generate, upload to storage and insert document record with category `'general'` if project selected
4. Toast confirmation

**`src/components/vendors/ScopeOfWorkSheet.tsx`**

Same pattern:
1. Add project selector state and fetch
2. Add "Save to Project" section
3. On generate, upload and insert with category `'contract'` if project selected
4. Toast confirmation

**Shared upload logic (inline in each component)**

```
async function saveToProject(htmlContent: string, projectId: string, docType: string) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const fileName = `${projectId}/${Date.now()}-${docType.toLowerCase().replace(/\s/g, '-')}.html`;
  
  await supabase.storage.from('project-documents').upload(fileName, blob);
  await supabase.from('project_documents').insert({
    project_id: projectId,
    file_path: fileName,
    file_name: `${docType} - ${new Date().toLocaleDateString()}.html`,
    file_size: blob.size,
    category: categoryForDocType,
    document_date: new Date().toISOString().split('T')[0],
    title: `${docType} - ${new Date().toLocaleDateString()}`,
  });
}
```

**UI Layout for the Save to Project section**

A new section at the bottom of each sheet, before the generate button:
- Section label: "Save to Project" (using existing `SectionLabel` pattern)
- `ProjectAutocomplete` component (already built, handles grouping/search)
- Small helper text: "Optional -- saves a copy to the project's Documents tab"
- The generate button text stays the same

**No database or migration changes needed** -- the `project_documents` table and `project-documents` storage bucket already exist with appropriate RLS policies.

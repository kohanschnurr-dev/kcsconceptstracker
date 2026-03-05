

## Remove "Also Included" from Scope of Work

Remove the "Also Included" section from both the form UI and the PDF output.

### Changes in `src/components/vendors/ScopeOfWorkSheet.tsx`
1. Remove `alsoIncluded` state declaration (line 61)
2. Remove `setAlsoIncluded([])` reset in `handleOpenChange` (line 82)
3. Remove `formatSection(alsoIncluded, 'ALSO INCLUDED')` from `buildContent()` (line 133)
4. Remove `alsoIncluded` from `getPdfOptions()` (line 163)
5. Remove the `<WorkItemLines>` block for "Also Included" (~lines 270-274)

### Changes in `src/lib/pdfExport.ts`
1. Remove `alsoIncluded` from `ScopeOfWorkData` interface (line 50)
2. Remove `...sow.alsoIncluded.filter(i => i.text)` from `workTotal` calculation (line 808)
3. Remove `renderWorkSection(sow.alsoIncluded, 'Also Included')` from HTML template (line 991)

Two files, straightforward deletions.


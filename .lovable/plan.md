

## Fix Unintended CSV Downloads

### Problem
The sample CSV download triggers when interacting with the modal in ways other than clicking the "Download Sample CSV" button. This is caused by event bubbling -- clicks on the dialog overlay or other elements can propagate and inadvertently trigger the download button's click handler.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`**

1. **Add `e.stopPropagation()` to the download button click handler** (line 352) to prevent event bubbling from triggering unintended downloads.

2. **Add `onPointerDownOutside` handler to `DialogContent`** to prevent pointer events outside the dialog from propagating and potentially triggering the download.

### Technical Details

- Line 352: Change `onClick={downloadSample}` to `onClick={(e) => { e.stopPropagation(); downloadSample(); }}`
- Line 330 (DialogContent): Add `onPointerDownOutside={(e) => e.preventDefault()}` so that clicking outside the modal doesn't cause side effects before the dialog closes.

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`

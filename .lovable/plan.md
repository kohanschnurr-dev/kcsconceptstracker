

## Plan: Copy Budget to Clipboard (Excel-Formatted)

### What
Add a copy button next to each saved budget in the TemplatePicker dropdown. Clicking it copies the full budget breakdown to the clipboard as tab-separated text — which pastes perfectly into Excel with columns and rows already aligned.

### Format
When copied, the clipboard will contain:
```
Budget: Farmers Branch Flip
Purchase Price	$150,000
ARV	$220,000

Category	Budget
Painting	$5,250
Flooring	$12,000
Cabinets	$8,000
...
Total	$78,000
```
Tab-separated so Excel picks up the columns automatically. Currency formatted with dollar signs.

### Changes

**`src/components/budget/TemplatePicker.tsx`**

1. Import `Copy` icon from lucide-react and `getBudgetCategories` from types
2. Add a `handleCopyBudget` function that:
   - Builds a tab-separated string with header row, purchase price, ARV, blank line, then each category with a non-zero value sorted alphabetically, then a total row
   - Uses `navigator.clipboard.writeText()` to copy
   - Shows a toast: "Budget copied to clipboard"
   - Calls `e.stopPropagation()` and `e.preventDefault()` to prevent the dropdown from closing or loading the template
3. Add a Copy icon button next to each saved budget row (between the dollar amount and the trash icon), styled consistently with the existing star/trash buttons

This is ~30 lines of new code in one file.


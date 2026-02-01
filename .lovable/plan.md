
## Plan: Fix Quantity Column Alignment

### Problem
The "Qty" column header is right-aligned, but the quantity input box inside each row is left-aligned within its cell, causing a visual misalignment.

### Solution
Add `ml-auto` to the Input element to push it to the right side of the cell, matching the header alignment.

### Changes

**File: `src/pages/BundleDetail.tsx`**

| Line | Current | New |
|------|---------|-----|
| 512 | `className="w-16 h-8 text-right text-sm"` | `className="w-16 h-8 text-center text-sm ml-auto"` |

Also change the text inside the input from `text-right` to `text-center` for better visual balance within the small input box.

### Result
- The quantity input box will be positioned to the right, aligning with the "Qty" header
- The number inside the input will be centered for better readability

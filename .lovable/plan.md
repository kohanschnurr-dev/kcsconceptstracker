
## Plan: Perfect Quantity Column Centering

### Problem
The quantity input box is using `ml-auto` which pushes it right, but the "Qty" header appears to be more centered. The input box and text inside need to be truly centered under the header.

### Solution
Change the TableCell to use flexbox centering instead of `text-right`, and center the input within it.

### Changes

**File: `src/pages/BundleDetail.tsx`**

| Line | Current | New |
|------|---------|-----|
| 502 | `<TableCell className="text-right">` | `<TableCell className="text-center">` |
| 512 | `className="w-16 h-8 text-center text-sm ml-auto"` | `className="w-16 h-8 text-center text-sm mx-auto"` |

### What This Does
1. Changes the `TableCell` from `text-right` to `text-center` so the content is centered in the column
2. Changes `ml-auto` to `mx-auto` on the Input to center it horizontally within the cell

### Result
- The quantity input box will be perfectly centered under the "Qty" header
- The number inside the input will remain centered

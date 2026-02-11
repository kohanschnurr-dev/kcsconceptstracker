

## Reorganize Procurement Item Modal Layout

### Changes

**1. Move Category above Assign to Bundles (full width)**
- Currently Category is a half-width field next to Quantity (lines 1385-1406)
- Move it to appear right after the Product Image section, before Assign to Bundles
- Make it full width (`col-span-2`) to match Assign to Bundles width

**2. Move Specifications above Notes**
- Currently Specifications appear right after Product Image (lines 1254-1266), before Assign to Bundles
- Move them to appear just before Notes (currently at line 1423), after Quantity
- This groups the core purchasing fields (Source, Price, Quantity) together, then specs, then notes

**3. Widen the popup**
- Change `max-w-2xl` to `max-w-4xl` on the DialogContent (line 1488) to eliminate the side scrollbar

### New field order in the details step
1. Item Name (full width)
2. Product Image (full width)
3. Category (full width - moved up)
4. Assign to Bundles (full width)
5. Source Store / Source URL (two columns)
6. Finish-Color / Unit Price (two columns)
7. Quantity (half width, standalone since Category moved)
8. Specifications (full width - moved down)
9. Notes (full width)
10. Pack price / Includes tax toggles

### Technical Details

**File: `src/components/budget/BudgetCanvas.tsx`** -- no changes needed

**File: `src/components/procurement/ProcurementItemModal.tsx`**
- Line 1488: change `max-w-2xl` to `max-w-4xl`
- Lines 1254-1266 (Specifications block): remove from current position
- Lines 1385-1406 (Category block): remove from current position, place as `col-span-2` after Product Image and before Assign to Bundles
- Insert Specifications block between Quantity and Notes
- Quantity field remains half-width on its own row


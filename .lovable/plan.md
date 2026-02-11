

## Move Product Image Section Below Assign to Bundles

### Change
Move the entire "Product Image" block (lines 1200-1252) to appear after the "Assign to Bundles" section (after ~line 1335), so the field order becomes:

1. Item Name
2. Category
3. Assign to Bundles
4. **Product Image** (moved down)
5. Source Store / Source URL
6. Finish-Color / Unit Price
7. Quantity
8. Specifications
9. Notes
10. Pack price / Tax toggles

### Technical Detail

**File: `src/components/procurement/ProcurementItemModal.tsx`**
- Cut the Product Image block (lines 1200-1252) from its current position between Item Name and Category.
- Paste it immediately after the Assign to Bundles section (after the bundle tags/chips closing div, around line 1335).
- No other changes needed -- all state and handlers remain the same.


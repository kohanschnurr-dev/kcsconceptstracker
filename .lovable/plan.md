

## Fix Double Dialog When Editing Vendor from Contact Card

When clicking "Edit Vendor" inside the contact card dialog, the click event bubbles up to the parent vendor card, which re-opens the contact card on top of the edit modal.

### Fix

**File: `src/pages/Vendors.tsx`**
- Add `e.stopPropagation()` to the "Edit Vendor" button's `onClick` handler inside the contact card dialog to prevent the event from reaching the vendor card underneath.

Single line change -- no other files affected.


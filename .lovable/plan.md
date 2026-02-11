

## Allow Clicking Outside to Close Vendor Contact Card

Remove the `onInteractOutside={(e) => e.preventDefault()}` from the vendor contact card's `DialogContent` in `src/pages/Vendors.tsx`. This will restore the default Radix Dialog behavior where clicking the overlay closes the dialog.

### Change

**File: `src/pages/Vendors.tsx`**
- On the contact card `DialogContent`, remove `onInteractOutside={(e) => e.preventDefault()}` so clicking outside the card dismisses it.


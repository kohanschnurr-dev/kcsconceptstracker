

## Fix: Prevent Contact Card from Opening When Editing via Dropdown or Contact Card

### Problem
Clicking "Edit" from the 3-dot dropdown menu (or the contact card's Edit button) opens BOTH the edit modal AND the contact card dialog, because the click event bubbles up to the vendor card's `onClick` handler.

### Root Cause
- The `DropdownMenuItem` for "Edit" (line 224) does not call `e.stopPropagation()`, so after the dropdown closes, the click reaches the card and sets `selectedVendor`.
- The contact card's "Edit Vendor" button has `e.stopPropagation()` but the dialog overlay click-through may still trigger the card underneath.

### Fix

**File: `src/pages/Vendors.tsx`**

1. **DropdownMenuItem "Edit" (line 224)**: Add `e.stopPropagation()` so clicking Edit in the menu doesn't also open the contact card.

```tsx
<DropdownMenuItem onClick={(e) => {
  e.stopPropagation();
  handleEditVendor(vendor);
}}>
```

2. **DropdownMenuItem "Delete" (line 228-234)**: Also add `e.stopPropagation()` for consistency.

```tsx
<DropdownMenuItem 
  className="text-destructive focus:text-destructive"
  onClick={(e) => {
    e.stopPropagation();
    setVendorToDelete(vendor);
    setDeleteDialogOpen(true);
  }}
>
```

3. **Contact card Dialog (line 293)**: Add `onInteractOutside` prevention on `DialogContent` so closing the contact card doesn't accidentally re-trigger the card click underneath:

```tsx
<DialogContent 
  className="sm:max-w-md"
  onInteractOutside={(e) => e.preventDefault()}
>
```

These three small changes ensure only one dialog opens at a time.


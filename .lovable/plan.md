

## Prevent Accidental Modal Closure on Add Contact Form

### Problem
The "Add New Contact" modal is a multi-step form (6 steps) that takes significant time to fill out. Currently, clicking the backdrop or pressing Escape closes it and loses all progress.

### Changes

**File: `src/components/crm/AddContactModal.tsx`**

1. Add `onInteractOutside={(e) => e.preventDefault()}` and `onEscapeKeyDown={(e) => e.preventDefault()}` to `<DialogContent>` — this prevents backdrop clicks and Escape key from closing the modal.

2. Change `<Dialog open={open} onOpenChange={onOpenChange}>` to `<Dialog open={open} onOpenChange={() => {}}>` so the dialog state is only controlled by explicit Cancel/Save actions.

3. Add a "Cancel" button (already may exist) that calls `onOpenChange(false)` explicitly.

4. Keep the existing form reset in the `useEffect` that fires when `open` changes — form only resets when reopened fresh.

This matches the existing pattern used for the Add Loan modal.


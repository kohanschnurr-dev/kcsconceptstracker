

## Plan: Prevent Add Loan Modal from Resetting on Outside Click

### Problem
When the user clicks outside the modal (or it loses focus), the `Dialog` fires `onOpenChange(false)`, which sets `open` to `false`. Then if reopened, the `useEffect` on line 93-102 resets the step to 0 and clears all form data.

### Fix

**File: `src/components/loans/AddLoanModal.tsx`**

1. **Prevent closing on outside click** — Add `onInteractOutside={(e) => e.preventDefault()}` to `DialogContent`. This stops the modal from closing when clicking the backdrop or pressing Escape accidentally.

2. **Only reset form on fresh open, not every toggle** — Change the reset `useEffect` to track a ref for whether the modal was previously closed, so it only resets when transitioning from closed → open (not on every render). Alternatively, gate the reset with a `prevOpen` ref:
   - Use a `useRef` to track the previous `open` value
   - Only reset form/step when `open` becomes `true` and was previously `false`

This ensures:
- Clicking outside the modal does nothing (modal stays open)
- Form data persists throughout the multi-step flow
- The form only resets when the modal is freshly opened via the "Add Loan" button

### Files to change
- `src/components/loans/AddLoanModal.tsx`


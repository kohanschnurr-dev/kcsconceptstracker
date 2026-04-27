## Add Delete Loan Button

Add a confirm-then-delete action on the **Loan Detail** page so users can remove a loan they created by mistake.

### Placement
Right side of the header, immediately to the **left of the Edit button** (matches the screenshot's action area). Use a `ghost` variant button with a `Trash2` icon and red text so it doesn't compete with the gold Edit CTA, but is still discoverable.

### Behavior
- Clicking opens an `AlertDialog` (shadcn) confirming: "Delete this loan? This permanently removes the loan and its draws, payments, and extensions. This cannot be undone."
- On confirm: call `deleteLoan.mutateAsync(loan.id)` (already exists in `useLoans`), then `navigate('/loans')`.
- Button is disabled while the mutation is pending.

### Files Changed
- **`src/pages/LoanDetail.tsx`** — import `useLoans`, `Trash2`, and `AlertDialog*`; add the Delete button + confirm dialog next to Edit; wire to `deleteLoan` and redirect on success.

No DB or schema changes — `deleteLoan` mutation and RLS DELETE policy already exist.

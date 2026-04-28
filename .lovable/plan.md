## Add "Save & Exit" to every step when editing a loan

Right now editing an existing loan forces a click through all 5 steps to reach the "Save Changes" button. Quick fixes on step 1 (e.g. updating Loan Purpose or Lender Name) shouldn't require traversing Terms → Fees → Draws → Collateral.

### Change

**`src/components/loans/AddLoanModal.tsx`** — `DialogFooter` (lines 633–649)

Add a secondary **Save & Exit** button that appears only when `initialData?.id` is set (i.e. edit mode) and the user is not yet on the final step. Clicking it triggers the existing `handleSubmit` (same validation: requires lender name + positive original amount), persists, and closes the modal.

Layout (edit mode, step < last):
```text
[ Back ]            [ Save & Exit ]  [ Next > ]
```

Create mode keeps the current single-button flow — no Save & Exit during initial creation, since partial loans aren't useful and required fields on later steps still need attention.

### Why this approach
- Reuses `handleSubmit` so validation, payload sanitization, and toast/close behavior stay identical.
- Outline variant for Save & Exit keeps the gold primary "Next" as the dominant action for users still progressing through steps.
- Disabled state mirrors the final Save button (`!form.lender_name || form.original_amount <= 0`) so we never persist an invalid loan.

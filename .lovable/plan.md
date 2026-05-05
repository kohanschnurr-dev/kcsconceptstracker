## Allow Reopening a Paid-Off Loan

Once a loan is marked Paid Off, the only status action available in the loan's "⋮" menu is the now-hidden "Mark Paid Off". Add a reverse action so users can reopen a loan that was closed by mistake or that needs further activity.

### Change
In `src/pages/LoanDetail.tsx`, in the action dropdown (around line 283), add a sibling menu item:

```tsx
{loan.status !== 'active' && (
  <DropdownMenuItem onClick={() => updateLoan.mutate({ id: loan.id, status: 'active' })}>
    <RotateCcw className="h-4 w-4 mr-2" /> Reopen as Active
  </DropdownMenuItem>
)}
```

- Imports `RotateCcw` from lucide-react.
- No balance changes — reopening leaves the existing `outstanding_balance` and any logged payoff payment in place. If the user wants the balance back, they can edit/delete that payment from the Payments tab.
- A short toast confirms ("Loan reopened") via the existing `updateLoan` success handler.

### Files touched
- `src/pages/LoanDetail.tsx` — add menu item + import.

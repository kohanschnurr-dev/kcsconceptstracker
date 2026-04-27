## Simplify Balance breakdown to match Loan Amount popover

### Problem
The current Balance popover mixes a subtraction row (`Principal Paid −$X`) with an intermediate subtotal (`Remaining Principal`) and then adds interest. It reads as two formulas glued together and feels like the math doesn't add up at a glance, even though the final number is correct.

The Loan Amount popover (reference) is purely additive: each row is a positive component, and they sum to the Total that matches the card value.

### Fix
Restructure the Balance popover to be a clean two-row sum that mirrors the Loan Amount style:

```
Remaining Principal       $308,557
Interest Accrued          $20,768
─────────────────────────────────
Balance                   $329,325
```

- Drop the `Loan Amount` and `Principal Paid −$X` rows.
- Keep only the two true components of the current Balance: remaining principal + accrued interest.
- Use the same visual treatment as the Loan Amount popover (muted labels, semibold total row with top border).

### File
**`src/pages/LoanDetail.tsx`** — replace the Balance `PopoverContent` body (the block currently rendering Loan Amount / Principal Paid / Remaining Principal / Interest Accrued / Balance) with the simplified two-row sum.

No logic or value changes — just clearer presentation.
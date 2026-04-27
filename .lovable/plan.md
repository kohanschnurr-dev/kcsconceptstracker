## Show payment math in the Balance popover

Expand the Balance breakdown popover so users can trace exactly how each payment knocked down the principal — turning the popover into a mini ledger.

### What the user sees

When they click the Balance card on the loan detail page:

```
Loan Amount                          $193,273
─────────────────────────────────
PAYMENTS APPLIED
  Mar 15, 2026                       $2,500
    - Principal                     -$1,800
    - Interest                        -$700
    Principal after                $191,473

  Apr 15, 2026                       $2,500
    - Principal                     -$1,820
    - Interest                        -$680
    Principal after                $189,653
─────────────────────────────────
Remaining Principal                $187,000
+ Interest Accrued                   $6,273
─────────────────────────────────
Balance                            $193,273
```

- Each payment shows date, total amount, then indented principal/interest/late-fee splits and the running principal *after* that payment.
- Payment list scrolls (max ~12 rem) when there are many entries.
- Late fees appear in warning color; principal/interest deductions in success green.
- If no payments exist yet, the Payments Applied section is hidden — it falls back to the simple Loan Amount → Remaining Principal + Interest = Balance view.

### File changes

- **`src/pages/LoanDetail.tsx`** — replace the existing Balance `PopoverContent` block (~lines 298-324). Widen popover from `w-64` → `w-80`. Sort `payments` by date, walk forward subtracting each principal portion from `loanAmountValue` to display the running principal. Use `formatDisplayDate` for dates and existing `fmt` currency helper.

No new data is needed — `payments` is already loaded on the page. No type/schema changes.
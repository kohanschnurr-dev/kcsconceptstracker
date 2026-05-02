## Add Edit to Loan Payments

Currently, manual payments in the Payment History table only have a Delete button. Auto-derived payments have a "Pencil" (Override) button that opens the Log Payment modal pre-filled. We'll add the same edit affordance to manual payments and properly persist updates.

### Changes

**1. `src/hooks/useLoans.ts` — new `updatePayment` mutation**
- Accepts `{ id, ...fields }`.
- Fetches the existing payment row to know its prior `principal_portion` (with the same fallback used by `addPayment`/`deletePayment`).
- Updates the row in `loan_payments` (date, amount, principal_portion, interest_portion, late_fee, notes).
- Adjusts the loan's `outstanding_balance` by the **delta** between old and new principal paid (clamped at 0, capped at `original_amount`), and flips `status` between `active`/`paid_off` accordingly — matching existing add/delete logic.
- Invalidates `loan_payments`, `loan`, `loans` queries; toast "Payment updated".

**2. `src/components/loans/PaymentHistoryTab.tsx`**
- Add optional prop `onUpdate?: (id: string, p: Omit<LoanPayment,'id'|'created_at'>) => void`.
- Track an `editingId: string | null` state. Add `handleEdit(p)` (mirrors `handleOverride` but stores the id).
- In the manual-row action cell, render both a Pencil (calls `handleEdit(p)`) and the existing Trash button.
- In `handleSubmit`, if `editingId` is set call `onUpdate(editingId, form)`, else `onAdd(form)`. Clear `editingId` in `resetAll`.
- Update `DialogTitle` to show "Edit Payment" when `editingId` is set.
- Keep the bulk mode unaffected (force `mode='single'` when editing).

**3. `src/pages/LoanDetail.tsx`**
- Pass `onUpdate={(id, p) => updatePayment.mutate({ id, ...p })}` into `<PaymentHistoryTab />`.

### Notes
- Auto-payment rows continue to use the existing "Override" flow (which inserts a new manual payment for that month). No change there.
- Validation rules (split must equal amount unless principal-only) already apply since we reuse the same single-payment form.

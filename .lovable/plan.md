## Add "Apply entire payment to principal" toggle

In the **Log Payment** modal (`src/components/loans/PaymentHistoryTab.tsx`), add a checkbox near the Interest/Principal split that, when checked, sends the full amount to principal and ignores accrued interest.

### UX
- New checkbox above the Interest Portion / Principal Portion fields:
  **☐ Apply entire payment to principal (skip interest)**
- When checked:
  - Interest Portion input becomes disabled and forced to `0`.
  - Principal Portion input becomes disabled and forced to the full `amount` (minus late fee, if any).
  - The "Interest is applied first…" hint is hidden.
  - Split-mismatch warning is suppressed.
- When unchecked: current auto-split behavior resumes (touched flags reset so suggestions recompute).

### Technical changes (single file)
`src/components/loans/PaymentHistoryTab.tsx`:
1. Add state `const [principalOnly, setPrincipalOnly] = useState(false);` and reset it whenever the modal opens/closes alongside the existing form reset.
2. In the auto-split effect (around lines 80–90), when `principalOnly` is true: set `interest_portion = 0`, `principal_portion = amount - (late_fee ?? 0)`, and skip the suggested-split logic.
3. Render a `<Checkbox>` (already imported pattern available via `@/components/ui/checkbox`) + label inside the dialog, placed right above the Interest/Principal grid cells (or spanning `col-span-2` at the top of the grid).
4. Pass `disabled={principalOnly}` to both the Interest Portion and Principal Portion `<Input>`s.
5. Wrap the "Interest is applied first…" hint and the split-mismatch warning in `{!principalOnly && …}`.
6. In `handleSubmit`, no logic change needed since the form fields will already hold the correct values; just ensure `splitMatches` is treated as true when `principalOnly` is on (e.g. `disabled={!form.amount || (!principalOnly && !splitMatches)}`).

No DB / schema changes — values persist exactly the same way (interest=0, principal=amount).
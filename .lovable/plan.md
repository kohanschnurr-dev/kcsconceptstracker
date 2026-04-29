## Bulk Log Payments

Add a "Bulk log" mode to the Log Payment modal so users can record several payments in one submission — either by repeating on the same day each month or by hand-picking dates — with overlap handling per row.

### UI Flow

The existing modal grows a single-line mode toggle at the top:

```text
[ Single ] [ Bulk ]   ← segmented control
```

**Single** keeps today's behavior unchanged.

**Bulk** swaps the body to:

1. **Date entry** — a sub-toggle:
   - **Repeat monthly**: Start date, # of payments (1–24), Interval (Monthly / Bi-weekly / Weekly). Generates dates on the same numerical day; if a month is short (e.g. Feb 30), clamp to last day of month and flag it.
   - **Custom dates**: A vertical list of date inputs with "+ Add date" / trash buttons.

2. **Defaults panel** (applied to every generated row):
   - Amount, Late Fee, "Apply entire payment to principal" checkbox, Notes.
   - Same auto-split logic as today using the live accrued-interest snapshot.

3. **Preview table** (the heart of the feature):
   ```
   Date         Amount    Interest   Principal   Late Fee   Status        ✕
   05/15/2026   $2,113    $1,200     $913        —          New           [trash]
   06/15/2026   $2,113    $1,180     $933        —          ⚠ Overlaps    [Override ▾] [trash]
                                                                          (Override / Skip)
   ```
   - Every cell editable inline (amount, split, late fee).
   - A row whose date matches an existing **auto-tracked** payment shows an amber "Overlaps" badge with an Override/Skip selector defaulting to Override.
   - A row whose date matches a **manual** payment is blocked with a red "Duplicate" badge and excluded from submit.
   - Footer totals: row count, total amount, total principal, total interest.

4. **Submit** — "Log N Payments" button. Disabled until every included row has amount > 0 and a matching split (or principal-only). On submit:
   - For Override rows, delete the auto stub for that date first, then insert the manual payment.
   - For Skip rows, do nothing.
   - All inserts run sequentially through the existing `onAdd` path so balance/accrual stays consistent.
   - On success: toast "Logged N payments", close modal, reset state.

### Edge cases

- **Short months** (e.g. start Jan 31 → Feb): clamp to last day, show small "adjusted" hint on that row.
- **Past dates** allowed (back-filling missed payments is the main use case).
- **Auto-split per row**: each row computes its own suggested split from the running balance *as of that date*, so a sequence of $2,113 payments correctly draws down interest first, then principal — not all using today's snapshot.
- **Principal-only** in defaults forces every generated row to interest=0; user can still tweak per row.
- **Modal persistence**: bulk mode ignores backdrop/Escape clicks (per project rule on multi-step modals) once any row has been edited.

### Technical Changes

**`src/components/loans/PaymentHistoryTab.tsx`** (main file, refactored)
- Extract the existing single-payment form into a new `<SinglePaymentForm>` sub-component for clarity.
- Add a new `<BulkPaymentForm>` sub-component containing the date-mode toggle, defaults panel, and preview table.
- Modal width grows to `max-w-3xl` when in Bulk mode (stays `max-w-md` in Single).
- Add a `mode: 'single' | 'bulk'` state at the modal root.
- New helpers (top of file):
  - `generateRecurringDates(start, count, interval)` — returns ISO date strings, handles month-end clamping.
  - `simulateSplits(rows, loan, existingPayments, draws, extensions)` — walks rows chronologically, calling `currentAccruedInterest` / `effectiveOutstandingBalance` against an accumulating ledger, so each row's suggested interest reflects the prior rows in the batch.
  - `classifyOverlap(date, payments)` — returns `'auto' | 'manual' | 'none'`.
- Submit handler iterates rows: for each Override row call a new `onDelete(autoStubId)` then `onAdd(payload)`; for each new row call `onAdd(payload)`. Use `await` if `onAdd` is async — inspect signature; if void, queue with `Promise.resolve` and run sequentially.

**`src/lib/loanPayments.ts`**
- Export a small helper `findPaymentOnDate(payments, dateISO)` so the modal doesn't duplicate the auto-stub matching logic that already lives there.

**`src/components/ui/`** — no new primitives; reuse `Tabs` (or a small inline segmented control), `Table`, `Input`, `Checkbox`, `Badge`, `Select` for the per-row Override/Skip dropdown.

No database schema changes. No new edge functions. The auto-payment override path already exists (`handleOverride`); bulk mode reuses the same insert+delete contract.

### Files to edit
- `src/components/loans/PaymentHistoryTab.tsx`
- `src/lib/loanPayments.ts` (small additive helper)

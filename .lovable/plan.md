## Make bulk-payment dates editable inline

In the bulk Log Payments preview, the Date column currently shows a static label (e.g. "Jan 2, 2026"). Replace it with a real date input so users can shift individual rows (e.g. one tenant pays on the 1st, another on the 3rd) without leaving the modal. Edits must survive the auto-regeneration that runs whenever defaults change.

### Behavior

- Each preview row shows a `<Input type="date">` instead of the static formatted date.
- Editing a row's date stores it as a per-row override and immediately re-classifies overlap (`auto` / `manual` / `none`) against existing payments.
- The "adjusted" warning chip (Feb 30 → Feb 28) is cleared once the user has manually picked a date for that row.
- Rows are still sorted chronologically in the preview and the simulated split walk uses the new date order.
- Submit uses the edited date.

### Technical changes — `src/components/loans/PaymentHistoryTab.tsx`

1. **Override key by index, not date.** Today the override map is keyed `${date}-${idx}`, so editing a date orphans the override. Switch to `row-${idx}` so overrides stick to the row position.
2. **Add `date` to the override shape** (already typed as `Partial<BulkRow>`, no type change needed). When the user edits a date cell call `updateRow(key, { date: newDate })`.
3. **Apply date overrides before sort** in the regen `useEffect`:
   - Map generated dates with their index → look up `rowOverrides[\`row-${idx}\`].date`, fall back to generated date.
   - Then sort chronologically and run the existing split simulation.
4. **Render** an `<Input type="date" className="h-8 text-xs">` in the Date cell, disabled when the row is `blocked` or `skipped`. Keep the small "adjusted" warning underneath only when the row has not been manually edited.

No new dependencies, no schema changes. Single file edit.

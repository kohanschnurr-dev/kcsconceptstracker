# Pair pending bank charges with queued receipts

## What you'll see
- **Pending bank charge card:** a "Receipt in queue" badge (or "Close match" in amber). Hover to see the receipt's store, date, amount and item count. Buttons: **Link receipt** and **Not the same**.
- **Receipt card under "Awaiting Bank Transaction":** a "Bank charge pending" badge (or "Close match") with the same two buttons and a hover showing the charge.
- **Charge already on a project or in KCS Concepts:** the button reads **Attach to existing expense**.
- **Banner and filter:** these pairs count toward the "possible duplicates" banner and show up under the **Duplicates** filter on both expense pages.
- Nothing changes until you click.

## Matching rules
- **Exact:** same amount to the cent, similar store name, and the receipt date falls from 2 days before to 7 days after the charge.
- **Close match:** same store, same date window, and the amount is within $1.00 or 2%.
- Each receipt pairs with its best charge only: exact beats close, then the nearest date wins.
- Receipts that already have a match ready for import are skipped.

## Link receipt
- Opens the usual receipt review window with the receipt and charge already paired. You can choose a project or KCS Concepts and edit the items and categories.
- **Pending charge:** works like a normal match. One expense is created with the receipt attached, the receipt leaves the queue, and the charge is marked handled so it leaves the pending list.
- **Charge already imported:** uses the existing "attach to existing expense" path, including the move confirmation for KCS Concepts. No new expense is created.
- **Close match:** the window shows both amounts. The expense uses the bank charge amount.
- Right before saving, it checks again that the charge isn't already handled and has no receipt. If either is true, it stops.

## Not the same
- Saves the pair so it never flags again, using the same memory as "Not a duplicate".

## Technical details
- `src/lib/duplicateDetection.ts`: add `detectReceiptChargePairs(pendingCharges, importedCharges, queuedReceipts, dismissed)` that returns `{level: 'receipt_exact'|'receipt_close', other}` flags keyed `qb:<base>` and `rcpt:<id>`. Add bun tests for the exact window edges (-2/+7 days), the $1/2% close rule, store mismatch, dismissal, and best-pair selection.
- `src/hooks/useDuplicateFlags.ts`: also load `pending_receipts` (status pending, unmatched) with a line-item count, merge the pair flags into the flags map and count, and expose `linkPair` info. Dismissals use `duplicate_dismissals` with `pairKey`.
- `DuplicateBadge.tsx`: render the new levels and actions (Link receipt / Attach to existing expense, Not the same).
- `SmartSplitReceiptUpload.tsx`: add an `openPairedReview(receiptId, qbId)` entry point. It builds a match object (`new`, or `existing` when the charge is already imported) and reuses the current review and import flow. Add the badge to "Awaiting Bank Transaction" cards. Pending charge cards in `GroupedPendingExpenseCard.tsx` open SmartSplit with that pair through a window event.
- No database changes.

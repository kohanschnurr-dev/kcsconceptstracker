# Duplicate transaction detection and flagging

## What you'll see
- **Red "Duplicate?" badge:** it appears on flagged rows in the Expenses table, the KCS Concepts business expenses table, and the QuickBooks pending cards on both pages. Hover over it to see the other record, for example "Also on 2102 Columbia Dr, Nov 1, $82.18" or "Also in KCS Concepts, Nov 14, $121.75".
- **Count banner and filter:** the top of the Expenses and Business Expenses pages shows a count like "6 possible duplicates". A **Duplicates** filter chip next to it shows only the flagged rows.
- **Two flag levels:**
  - **Likely duplicate (red):** same amount to the cent, same date, and the same bank description/reference or the same bank charge ID.
  - **Possible duplicate (amber outline, still labeled "Duplicate?"):** same amount to the cent, the same store (for example "Amazon Mktpl" and "Amazon.com" count as the same store), and dates within 3 days.
- **Already imported:** a pending bank charge that matches something already on a project or in KCS Concepts. It matches by bank charge ID, or by the same amount, date and description. It gets the badge "Already imported", with the record named in the tooltip.
- **Actions on each flag:**
  - **Not a duplicate:** clears the flag and remembers your choice, so this pair never flags again.
  - **Delete this one:** first asks for confirmation, for example "Delete $82.18 (Nov 1) from 2102 Columbia Dr?". Cancel does nothing.
  - **Remove from pending:** shown only on "Already imported" pending charges, instead of Delete. It marks the charge as handled, so it leaves the pending list and doesn't come back on the next bank sync.
- **Warning on import:** if importing a pending charge would create a likely duplicate, a confirm names the existing record first. You can still continue.
- **Split expenses:** category pieces of the same split expense are never flagged against each other.
- **Nothing is ever deleted or removed automatically.**

## Technical details
- **New table `duplicate_dismissals`:**
  - Columns: `user_id`, `record_a`, `record_b`, `created_at`.
  - Each record key is `table:id`, or `qb:<base qb_id>` for QuickBooks rows. The pair is stored in sorted order.
  - Unique on `(user_id, record_a, record_b)`.
  - Access: grants plus row-level security so each user can only select, insert and delete their own rows.
- **New `src/lib/duplicateDetection.ts`:** pure functions with bun tests. Tests cover:
  - high: same cents, same date, same description
  - medium: ±3 days with the same normalized vendor
  - already-imported: by base ID, or by amount + date + description
  - split rows sharing a base are never compared to each other
  - dismissed pairs are skipped

  The record shape is `{ key, source, amount, date, vendor, description, qbBase, location (project name or "KCS Concepts") }`. Records are bucketed by cents, so the work is close to linear.
- **New `useDuplicateFlags` hook:** loads the comparison set: project `expenses`, imported `quickbooks_expenses` with a project, `business_expenses`, pending `quickbooks_expenses`, and the dismissals. It returns a flag map and the counts.
- **New `DuplicateBadge` component:** a badge with a tooltip and a small menu holding the actions.
- **Where it's added:**
  - `Expenses.tsx`: banner, chip, and the badge in `GroupedExpenseRow`
  - `BusinessExpenses.tsx`: banner, chip, and the badge on table rows
  - `GroupedPendingExpenseCard.tsx` and the business pending list: badge plus "Remove from pending"
- **What the actions do:**
  - Delete for a manual expense or business expense row: deletes the row.
  - Delete for a QuickBooks project row: removes it from the project and hides it (`is_hidden = true`, `project_id = null`), so the bank sync doesn't recreate it. All split rows for that charge are handled together.
  - "Remove from pending": sets `is_imported = true` on that pending row.
- **Import warning:** the existing pending-import functions in `useQuickBooks.ts`, and the business import, run the high-duplicate check first and `window.confirm` if they find a match.

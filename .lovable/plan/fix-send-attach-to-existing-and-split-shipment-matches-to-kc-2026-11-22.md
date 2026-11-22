# Fix: send "Attach to existing" and split-shipment matches to KCS Concepts

## What changes for you
When you choose **KCS Concepts** for an "Attach to existing expense" or "Split shipment" match and click **Import to Business**:

- **Charges not on a project yet:** each one becomes a KCS Concepts business expense. It gets the receipt image, the items and the categories you picked, split the same way a normal business import splits them.
- **Charges already on a project:**
  - First a confirm box names each move, for example "Move $297.64 from 2102 Columbia Dr to KCS Concepts?". If a group touches more than one project, every move is listed in the same box.
  - Cancel changes nothing.
  - OK removes that charge's rows from the project, including its category splits, so it no longer counts toward the project. Then it creates the business expense with your receipt and categories.
- **Marked as handled:** each charge is marked as handled, so it won't come back in the KCS Concepts QuickBooks pending list or be re-added by the next bank sync.
- **Duplicate check:** right before saving, the app checks again that none of the charges already has a receipt. If one does, it stops and changes nothing.
- **Project stays the same:** choosing **Project** works exactly as it does today.

## Technical details (`SmartSplitReceiptUpload.tsx`, `finalizeImport` only)
- Remove the `assignmentType !== 'project'` throw. The re-check that `receipt_url` is null stays for both modes.
- **Business + existing/split:**
  1. Group the charges by base qb_id, which is `qb_id` with any `_split_*` suffix removed. Load every `quickbooks_expenses` row for each base, both `<base>` and `<base>_split_%`.
  2. Bases that have a row with a `project_id` are moves. Look up the project names, then use `window.confirm` with the amounts (`original_amount`, or the sum of the rows) and the project names. Cancel aborts the whole import.
  3. For each charge, create `business_expenses` rows by category. The charge amount is split by the proportions of your chosen categories, using the existing business-insert code with `receipt_url`.
  4. **Handled marker:** keep exactly one row per base and delete the rest of that base's rows. The kept row becomes:
     - `qb_id = <base>_split_business`
     - `project_id = null`, `category_id = null`
     - `is_imported = true`, `amount = full charge`
     - `receipt_url` set
     
     Keeping this row matters: the QuickBooks sync skips any base that has a `_split_` row, so the charge is never re-inserted as pending. It also stays out of every project total.
  5. Set the receipt's status to `imported`.
- No changes to the matching function, the database, or the Project path.

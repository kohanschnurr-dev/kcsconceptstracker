# Better receipt matching: existing expenses + Amazon split shipments

## What changes for you
- **Attach to existing expense:** If no new bank charge matches a receipt, the app also checks charges you already put on a project. It looks for the same amount (to the cent), a date from 2 days before to 5 days after the receipt, a similar store name, and no receipt attached yet. The match shows in "Matches Ready for Import" with the label **Attach to existing expense** and the project name, such as 2102 Columbia Dr. Nothing changes until you confirm.
- **On confirm:** The receipt photo and its items go onto that existing expense. Items are split by category the same way the normal import does it, and the expense stays on the same project. No new expense is created, and the matched charge can't be linked twice.
- **Amazon split shipments:** If a receipt has no single matching charge, the app looks for 2 to 5 charges from the same store in the same date window that add up to the receipt total, to the cent. It checks both new charges and ones already on a project. The group shows as **Split shipment: N charges**, with each charge's date and amount. When you confirm, every charge gets linked to the receipt and the items are spread across them.
- Everything else stays the same: the rules for one-to-one matches, the business/project choice, and the rest of the review screen.

## Your data right now
- Home Depot $293.88 (Nov 3) and $103.00 (Oct 30) are already on 2102 Columbia Dr with no receipt attached, so they will become "Attach to existing expense" matches.
- Amazon $35.59 and $116.88 (Nov 9) each appear twice. One copy is already on 2102 Columbia Dr with a receipt attached. The other is a new, unassigned charge. The no-receipt rule keeps the attached copies from being matched again.
- I couldn't find a Home Depot $61.96 charge around Nov 5 in your synced bank charges. Once it syncs, it will match the same way.

## Technical details
- `match-receipts`:
  - Pass 1 stays as it is today.
  - Pass 2 checks imported `quickbooks_expenses` (`is_imported = true`, `receipt_url IS NULL`) using the same amount and date rules, and requires vendor similarity of at least 0.5. The vendor check includes `original_amount` for charges that were already split.
  - Pass 3 searches for subsets of 2 to 5 charges from the same vendor, drawn from both pools, whose total equals the receipt within $0.01. It picks the subset with the closest dates.
  - Charges already claimed by another match in the same run are left out.
- Match details live on `pending_receipts`: new nullable columns `match_type` (`new` | `existing` | `split`) and `matched_qb_ids text[]`. These are added through a migration; `matched_qb_id` stays as the main ID.
- UI (`SmartSplitReceiptUpload.tsx`):
  - Match cards show the label, the project name and the charge list.
  - On confirm, the existing expense is updated in place, with category splits using the `_split_` qb_id rows, `receipt_url` and the existing project.
  - For split groups, items are assigned to charges largest item first so each charge's total adds up, and the rest is spread proportionally with rounding fixed on the last charge.
  - Before writing, the app re-checks that each charge still has no receipt, which prevents duplicates.
- Redeploy `match-receipts`.

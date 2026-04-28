## Rename "Loan Name" → "Loan Purpose" + preset picker with custom override

The screenshot shows the **Loan Name** column rendering free-form values like "Treehouse/Wales", "Construction Costs", "Purchase & Constr…", "Land Costs", "DSCR". We'll reframe this as the loan's *purpose* (corporate term) and replace the free-text nickname with a curated dropdown plus an "Other" escape hatch.

### Terminology
Use **"Loan Purpose"** across the UI (column header, modal label, detail page). The underlying DB column `loans.nickname` stays the same — no migration needed; it just stores the chosen preset label or the user's custom text.

### Preset options (pulled from the existing data + standard CRE finance terms)
- Acquisition / Purchase
- Construction
- Purchase & Construction
- Renovation / Rehab
- Land Acquisition
- Refinance
- Cash-Out Refinance
- Bridge
- DSCR / Long-Term Hold
- Working Capital
- Other… (reveals a text input)

### Files to change

**`src/components/loans/AddLoanModal.tsx`** (step 0, ~line 240)
Replace the `<Input>` for nickname with a `<Select>` populated from the preset list above. When the user picks **"Other…"**, render an inline `<Input>` below the select and bind it to `form.nickname`. When a preset is picked, write that label directly to `form.nickname`. Update the `<Label>` to **"Loan Purpose"**. Determine initial mode by checking whether the existing value matches a preset.

**`src/components/loans/LoanTable.tsx`** (line 184)
Change column header `Loan Name` → `Loan Purpose`. Cell rendering on line 221 stays the same (`loan.nickname ?? loan.lender_name`). Search placeholder on line 96 ("Search lender, project…") gets "purpose" added.

**`src/pages/LoanDetail.tsx`** (line 225 area)
Where the title currently falls back through nickname/lender, no logic change is required — but if there's a labeled "Nickname" field on the page, rename it to "Loan Purpose". (I'll verify and adjust on implementation.)

**Shared constant**
Add `LOAN_PURPOSE_OPTIONS` to `src/types/loans.ts` so both the modal and any future edit surface share one source of truth.

### Backward compatibility
Existing loans with arbitrary nickname strings (e.g. "Treehouse/Wales") will simply land in **Other…** mode when edited — their text loads into the inline input automatically. No data backfill needed.

### Out of scope
- No DB migration (column name `nickname` stays).
- No inline-edit affordance on the detail page in this pass — only the create/edit modal gets the new picker. Let me know if you also want the detail header to be click-to-edit and I'll add that.

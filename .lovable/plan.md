
# Generate Documents from Folders — Contractor Projects (Documents Tab)

## Overview

On contractor projects, the Documents tab will surface a **"Generate"** button in the toolbar that opens a dropdown with three AI document types:
- **Scope of Work** (reuses the existing `ScopeOfWorkSheet` component, pre-seeded with the project's vendor list)
- **Invoice** (new AI sheet)
- **Receipt** (new AI sheet)

This is only shown when `project.project_type === 'contractor'`.

---

## Where the "Generate" Button Lives

Inside `DocumentsGallery.tsx`, the card header already has two action buttons (`+ Folder`, `+ Add`). A third **"Generate"** button with a `Sparkles` icon is added next to them, but **only rendered when the project is a contractor type**.

To know the project type inside `DocumentsGallery`, we need to pass it as a prop:

```tsx
// Before:
<DocumentsGallery projectId={id!} />

// After:
<DocumentsGallery projectId={id!} projectType={project.project_type} />
```

---

## Generate Dropdown Menu

Clicking "Generate" opens a `DropdownMenu` with three items:

```
⚡ Sparkles icon  "Generate"  ▾
────────────────────────────────
  📄 Scope of Work
  💵 Invoice
  🧾 Receipt
```

Each item opens its corresponding sheet/modal.

---

## Document Type Sheets

### 1. Scope of Work — Reuse Existing

The existing `ScopeOfWorkSheet` from `src/components/vendors/ScopeOfWorkSheet.tsx` is reused with zero changes. We just need to:
- Load the project's vendor list from `project_vendors` + `vendors` join inside the Documents tab
- Pass `vendors` into `ScopeOfWorkSheet`

### 2. Invoice Generator — New Component

**File:** `src/components/project/GenerateInvoiceSheet.tsx`

A right-side Sheet with sections:

**INVOICE INFO**
- Company Name (pre-filled from `useCompanySettings`)
- Client / Property Name
- Invoice Number (e.g. INV-001)
- Invoice Date (today)
- Due Date

**JOB DETAILS**
- Project Name (pre-filled from project)
- Project Address (pre-filled from project)
- Description of Work

**LINE ITEMS** (dynamic rows)
- Add line item: Description | Qty | Unit Price → auto-calculates row total
- "+ Add Line Item" button
- Running subtotal, tax (% toggle), and total shown below

**PAYMENT INFO**
- Payment Method (select: Check / Wire / Zelle / Venmo / Cash / Other)
- Payment Instructions / Notes (textarea)

**OUTPUT SETTINGS**
- Same Length/Tone toggles as Scope of Work

Generate Button → calls same edge function pattern → formatted plain-text output with Copy button

### 3. Receipt Generator — New Component

**File:** `src/components/project/GenerateReceiptSheet.tsx`

A simpler sheet:

**RECEIPT INFO**
- Company / Vendor Name (pre-filled from company settings)
- Receipt Date (today)
- Receipt Number

**JOB DETAILS**
- Project Name (pre-filled)
- Description of Work / Services

**LINE ITEMS** (same dynamic pattern as Invoice)
- Description | Qty | Unit Price | Total

**PAYMENT**
- Amount Paid
- Payment Method
- Payment Date
- Notes

Generate Button → AI-formatted receipt document → Copy

---

## New Edge Functions

Both Invoice and Receipt use the same Lovable AI gateway pattern as `generate-scope-of-work`.

**`supabase/functions/generate-invoice/index.ts`**  
- Model: `google/gemini-3-flash-preview`
- System prompt instructs AI to write a professional contractor invoice in plain text with clear formatting
- Input: all form fields including line items array

**`supabase/functions/generate-receipt/index.ts`**  
- Model: `google/gemini-3-flash-preview`
- System prompt writes a professional payment receipt
- Input: all form fields

Both get `verify_jwt = false` entries added to `supabase/config.toml`.

---

## Files to Change

| File | Change |
|---|---|
| `src/components/project/DocumentsGallery.tsx` | Add `projectType` prop, `Generate` dropdown button (contractor-only), vendor load, sheet state |
| `src/pages/ProjectDetail.tsx` | Pass `projectType={project.project_type}` to `DocumentsGallery` |
| `src/components/project/GenerateInvoiceSheet.tsx` | New — Invoice generator UI |
| `src/components/project/GenerateReceiptSheet.tsx` | New — Receipt generator UI |
| `supabase/functions/generate-invoice/index.ts` | New — AI edge function |
| `supabase/functions/generate-receipt/index.ts` | New — AI edge function |
| `supabase/config.toml` | Add `verify_jwt = false` for both new functions |

---

## UI Placement Detail

```
DocumentsGallery header (right side):
[ ✦ Generate ▾ ]  [ 📁 Folder ]  [ + Add ]
```

The Generate button uses `variant="outline"` with a `Sparkles` icon. On mobile, it shows icon-only. On desktop, shows "Generate" text. The dropdown appears on click.

---

## What Does NOT Change

- Folder system, drag-and-drop, uploads — untouched
- `ScopeOfWorkSheet` — reused with zero edits (the vendor list is fetched inside `DocumentsGallery`)
- Non-contractor project types — the Generate button is not shown at all
- The Vendors page Scope of Work button — untouched

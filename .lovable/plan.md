

## Add Line Items to Project Vendors

### Problem
Currently, vendor charges on a project are stored as free-text notes (e.g., "Demo $2,500 / Flooring $4,000"). There's no structure, so you can't total charges per vendor or across the project.

### Solution
Add a structured line items system to each project vendor assignment. Each line item has a description and dollar amount. The free-text notes field stays for general comments, but charges get their own dedicated rows.

### Database Change

Add a `line_items` JSONB column to the `project_vendors` table:

```
ALTER TABLE project_vendors
ADD COLUMN line_items jsonb NOT NULL DEFAULT '[]'::jsonb;
```

Each entry will be shaped like `{ description: string, amount: number }`. Using JSONB on the existing table avoids creating a separate join table and keeps the UI simple.

### UI Changes

**`src/components/project/ProjectVendors.tsx`**

Replace the single notes textarea with a two-part section:

1. **Line Items List** -- Each item shows description on the left and dollar amount on the right, with an X button to remove. Below the list, a running total for that vendor.

2. **Add Line Item Row** -- An inline row with a description input and amount input, plus a "+" button. Tapping "+" appends the item to the JSONB array and saves immediately.

3. **Notes** -- The existing free-text notes field stays below line items (collapsed by default, expandable) for general comments that don't have dollar amounts.

**Per-vendor card layout (updated):**

```text
+------------------------------------------+
| Jose  [wrench icon]              [trash]  |
| [phone chip] [email chip]                 |
| [calendar] Jan 16, 2026                   |
|                                           |
| Line Items                                |
|   Demo .......................... $2,500   |
|   Flooring ...................... $4,000   |
|   Drywall & Paint .............. $6,000   |
|   + [description____] [$____] [+]        |
|                          Total: $12,500   |
|                                           |
| [Notes] (collapsible)                     |
+------------------------------------------+
```

### Technical Details

- `line_items` stored as `jsonb` with shape `Array<{ description: string; amount: number }>`
- Each add/remove triggers an immediate Supabase update (same pattern as existing `updateNotes`)
- New `addLineItem` and `removeLineItem` functions handle array manipulation and save
- Vendor total calculated client-side from `line_items.reduce(...)`
- The "Assign Vendor" dialog also gets a line items section so users can add charges during assignment


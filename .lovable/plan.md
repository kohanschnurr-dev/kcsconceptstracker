
# Replace "Scope of Work" Button with "Generate" Dropdown on the Vendors Page

## What Changes

The standalone **"Scope of Work"** button in the Vendors page header is replaced with a **"Generate"** dropdown button that has three items — exactly matching the Documents tab behavior on contractor projects.

```
Before:   [ Scope of Work ]  [ + Add Vendor ]
After:    [ ✦ Generate ▾ ]   [ + Add Vendor ]

Dropdown items:
  📄 Scope of Work
  💵 Invoice
  🧾 Receipt
```

---

## File to Change

Only **one file** changes: `src/pages/Vendors.tsx`

### Changes needed

**1. Imports (lines 1–3):**
- Add `Sparkles`, `Receipt` to the lucide-react import (remove `FileText` since it's absorbed into the dropdown)
- Add `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu` (already imported at line 10)
- Import `GenerateInvoiceSheet` and `GenerateReceiptSheet`

**2. State (around line 66):**
- Keep `scopeSheetOpen` / `setScopeSheetOpen`
- Add `invoiceOpen` / `setInvoiceOpen`
- Add `receiptOpen` / `setReceiptOpen`

**3. Header button (lines 165–168):** Replace the single `<Button>` with a `DropdownMenu`:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="gap-2">
      <Sparkles className="h-4 w-4" />
      Generate
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => setScopeSheetOpen(true)} className="gap-2">
      <FileText className="h-4 w-4" /> Scope of Work
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setInvoiceOpen(true)} className="gap-2">
      <FileText className="h-4 w-4" /> Invoice
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setReceiptOpen(true)} className="gap-2">
      <Receipt className="h-4 w-4" /> Receipt
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**4. Sheets (around lines 336–340):** Keep the existing `<ScopeOfWorkSheet>` and add two new ones:
```tsx
<GenerateInvoiceSheet open={invoiceOpen} onOpenChange={setInvoiceOpen} />
<GenerateReceiptSheet open={receiptOpen} onOpenChange={setReceiptOpen} />
```

---

## What Does NOT Change

- All vendor card logic, modals, filters — untouched
- `ScopeOfWorkSheet` component — untouched
- `GenerateInvoiceSheet` / `GenerateReceiptSheet` — already exist, just reused
- The generate-invoice and generate-receipt edge functions — already deployed

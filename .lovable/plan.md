
# Replace "Receipt" with "Generate PDF" in the Vendors Page Dropdown

## What the User Wants

On the Vendors page, the Generate dropdown currently has:
- Scope of Work
- Invoice
- **Receipt** ← replace this

They want **"Generate PDF"** instead — a one-click action that immediately exports a professional, themed PDF of the vendor list without any AI form or sheet.

---

## How It Works

Clicking "Generate PDF" will:
1. Format all current vendors into a clean plain-text / structured document string
2. Call the existing `generatePDF()` utility (which already handles branding, theming, logo, and print) — no new utility needed
3. Open the browser's print dialog pointing at a styled vendor list PDF

The PDF content will include each vendor's:
- Name
- Trade(s)
- Phone & Email
- Rating (★ stars)
- Pricing model
- W9 status
- Notes (if any)

---

## Files to Change

Only **one file** changes: `src/pages/Vendors.tsx`

### Changes

**1. Import additions:**
- Add `generatePDF` from `@/lib/pdfExport`
- Add `useCompanySettings` hook
- Remove `Receipt` from lucide-react imports (no longer needed)
- Remove `GenerateReceiptSheet` import
- Add `Download` to lucide-react imports

**2. State:**
- Remove `receiptOpen` / `setReceiptOpen` state
- Add `const { settings, companyName } = useCompanySettings()`

**3. New handler function — `handleGenerateVendorPDF`:**

```typescript
const handleGenerateVendorPDF = () => {
  const lines: string[] = [];
  lines.push(`VENDOR DIRECTORY`);
  lines.push(`Total: ${filteredVendors.length} vendor(s)\n`);
  lines.push('─'.repeat(60));

  filteredVendors.forEach((vendor, i) => {
    lines.push(`\n${i + 1}. ${vendor.name.toUpperCase()}`);
    if (vendor.trades.length > 0) {
      lines.push(`   Trades: ${vendor.trades.map(getTradeLabel).join(', ')}`);
    }
    if (vendor.phone) lines.push(`   Phone: ${vendor.phone}`);
    if (vendor.email) lines.push(`   Email: ${vendor.email}`);
    lines.push(`   Rating: ${'★'.repeat(vendor.reliability_rating || 0)}${'☆'.repeat(5 - (vendor.reliability_rating || 0))}`);
    lines.push(`   Pricing: ${vendor.pricing_model === 'flat' ? 'Flat Rate' : vendor.pricing_model === 'hourly' ? 'Hourly' : 'Not set'}`);
    lines.push(`   W9 on File: ${vendor.has_w9 ? 'Yes' : 'No'}`);
    if (vendor.notes) lines.push(`   Notes: ${vendor.notes}`);
    lines.push('   ' + '─'.repeat(56));
  });

  generatePDF(lines.join('\n'), {
    docType: 'Receipt',  // We'll rename this label in options
    companyName: companyName || 'Your Company',
    logoUrl: settings?.logo_url,
  });
};
```

> Note: We'll update `PdfOptions.docType` to accept a `'Vendor Directory'` string, or simply pass a custom label. The simplest path is to pass `docType: 'Vendor Directory'` — which requires updating the `PdfOptions` type in `pdfExport.ts` to allow that value.

**4. Dropdown item replacement:**

```tsx
// Remove:
<DropdownMenuItem onClick={() => setReceiptOpen(true)} className="gap-2">
  <Receipt className="h-4 w-4" /> Receipt
</DropdownMenuItem>

// Replace with:
<DropdownMenuItem onClick={handleGenerateVendorPDF} className="gap-2">
  <Download className="h-4 w-4" /> Generate PDF
</DropdownMenuItem>
```

**5. Remove the `<GenerateReceiptSheet>` JSX** from the render (line 362).

---

## Update to `pdfExport.ts`

The `docType` union type needs one addition:

```typescript
// Before:
docType: 'Invoice' | 'Receipt' | 'Scope of Work';

// After:
docType: 'Invoice' | 'Receipt' | 'Scope of Work' | 'Vendor Directory';
```

And the icon map in `pdfExport.ts` needs an entry:
```typescript
'Vendor Directory': '&#128101;', // 👥 people icon
```

---

## What the PDF Looks Like

```
┌──────────────────────────────────────────────────────┐
│  [LOGO]     ACME CONSTRUCTION         👥 VENDOR DIR  │  ← themed header
├──────────────────────────────────────────────────────┤
│  Prepared by Acme Construction    Generated Feb 19   │  ← meta bar
├──────────────────────────────────────────────────────┤
│                                                      │
│  VENDOR DIRECTORY                                    │
│  Total: 8 vendor(s)                                  │
│  ────────────────────────────────────────────────    │
│                                                      │
│  1. JOHN SMITH PLUMBING                              │
│     Trades: Plumbing, HVAC                           │
│     Phone: (555) 123-4567                            │
│     Email: john@smithplumbing.com                    │
│     Rating: ★★★★☆                                   │
│     Pricing: Hourly                                  │
│     W9 on File: Yes                                  │
│     ────────────────────────────                     │
│                                                      │
│  2. ELITE ELECTRICAL ...                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Summary of File Changes

| File | Change |
|---|---|
| `src/pages/Vendors.tsx` | Replace Receipt dropdown item + state + sheet with Generate PDF handler |
| `src/lib/pdfExport.ts` | Add `'Vendor Directory'` to docType union + icon map |

No edge functions. No database changes. No new components.

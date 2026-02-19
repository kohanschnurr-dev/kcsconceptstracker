
# Remove AI Generation — Use Form Data Directly for PDF

## What's Changing

Right now, all three sheets (Invoice, Receipt, Scope of Work) send the form data to an AI edge function, which writes a text document, and that text is then parsed and rendered as a PDF. The user wants to skip the AI entirely — the PDF should be built directly from what was typed into the form.

This means replacing the current approach:

```
Form fields → AI edge function → plain text → renderContent() → PDF
```

With:

```
Form fields → buildStructuredContent() → PDF
```

## Files to Change

- `src/components/project/GenerateInvoiceSheet.tsx`
- `src/components/project/GenerateReceiptSheet.tsx`
- `src/components/vendors/ScopeOfWorkSheet.tsx`

No edge functions or `pdfExport.ts` need to change.

## How Each Sheet Will Build Its Content String

Instead of calling `supabase.functions.invoke(...)`, `handleGenerate` will synchronously build a plain-text string from the form fields — formatted exactly like the AI used to output — and call `generatePDF()` immediately.

### Invoice

```
INVOICE

Invoice Number:  INV-001
Invoice Date:    2025-02-19
Due Date:        2025-03-05

FROM
Company:  KCS Concepts

TO
Client:   John Smith

PROJECT
Project:   123 Main St Rehab
Address:   123 Main St, City, ST

DESCRIPTION OF WORK
Full kitchen renovation including demo, framing, and finish work.

LINE ITEMS
  Demolition: 1 x $500.00 = $500.00
  Framing:    2 x $350.00 = $700.00

SUBTOTAL: $1,200.00
TAX (8%): $96.00
TOTAL DUE: $1,296.00

PAYMENT INFORMATION
Payment Method: Check
Notes: Make checks payable to KCS Concepts LLC
```

### Receipt

```
PAYMENT RECEIPT

Receipt Number: RCP-001
Receipt Date:   2025-02-19

FROM
Vendor:   KCS Concepts

FOR PROJECT
Project:  123 Main St Rehab

DESCRIPTION OF WORK / SERVICES
Plumbing rough-in and fixture installation.

LINE ITEMS
  Rough-in: 1 x $800.00 = $800.00
  Fixtures: 3 x $120.00 = $360.00

TOTAL PAID: $1,160.00

PAYMENT DETAILS
Payment Method: Zelle
Payment Date:   2025-02-19
Notes: Payment confirmed via Zelle to vendor
```

### Scope of Work

```
SCOPE OF WORK

Company:    KCS Concepts
Contractor: Reliable Electric LLC
Customer:   123 Main St, City, ST
Date:       2025-02-19
Job Number: JOB-2025-012

TRADE / TRADE TYPE
Electrical, Low Voltage

JOB TITLE
Panel upgrade and outlet installation

LOCATION / AREA
Basement and main floor

KEY QUANTITIES
2 panels, 12 outlets

WORK TO BE PERFORMED
Remove old 100A panel
Install new 200A panel
Run new circuits to kitchen and laundry
Install 12 new outlets per code

ALSO INCLUDED
Debris removal
Final cleanup

NOT INCLUDED / EXCLUSIONS
Permits
Drywall repairs

MATERIALS
Contractor provides all materials

SPECIAL NOTES
Access via side gate. Work scheduled for mornings only.
```

## UI Cleanup

- Remove `isGenerating` state (no async operation needed — it's instant)
- Remove `Loader2` and `Sparkles` icon imports (replace button icon with `FileText`)
- Remove `supabase` import from all three sheets
- Remove `Output Settings` section (Length/Tone toggles) from Invoice and Scope of Work sheets — they were only relevant to AI generation
- Update button label: "Generate Invoice PDF", "Generate Receipt PDF", "Generate Scope of Work PDF" — using `FileText` icon
- The button becomes a regular synchronous click, no `disabled` loading state needed (keep vendor required check on Scope of Work)

## Technical Details

- Omit any section whose fields are all empty (e.g., no exclusions → skip "NOT INCLUDED" header)
- Line items with no description or price are skipped
- The content string is passed directly to `generatePDF()` — the existing `renderContent()` parser already handles ALL CAPS section headers, key:value pairs, and total lines correctly, so the output will look polished without any changes to `pdfExport.ts`

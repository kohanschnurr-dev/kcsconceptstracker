

## Remove "Issued By" from Receipt Generator & PDF

Three files need edits:

### 1. `src/components/project/GenerateReceiptSheet.tsx`
- Remove the `issuingCompany` constant
- Remove the entire "ENTITY BANNER" div (the rounded box showing "Issued By (Platform)" and "Receipt From (Vendor)")
- Remove `issuingCompany` from `buildContent()` (the "ISSUED BY (PLATFORM)" section)
- Remove `issuingCompany` from `getPdfOptions()` receipt data

### 2. `src/lib/pdfExport.ts`
- Remove the `issuingCompany` field from the `ReceiptData` interface
- Remove the "Issued By" entity cell from the receipt HTML template (keep the "Received From (Vendor)" cell, just remove the issuer cell)

### 3. `supabase/functions/generate-receipt/index.ts`
- No changes needed (AI plain-text path is separate and rarely used)

Only the "Issued By / KCS Concepts" block is removed — vendor info, line items, payment details, and everything else stays as-is.




## Move Receipt Upload to Top and Add PDF/File Support

### What Changes

The "Add Receipt Photo" section currently sits near the bottom of the form (below Description). This plan moves it to the very top -- above Project and Category -- so mobile users can tap it first, get AI-parsed data, and have the form auto-fill below.

### Changes to `src/components/QuickExpenseModal.tsx`

**1. Combine "Quick Import" (paste text) and "Receipt Upload" into a single top section**

- Remove the current "Quick Import" block (lines 241-261) and the "Receipt (optional)" block (lines 336-357) from their current positions
- Create a new unified "Scan Receipt" section at the very top of the form (line 240, before Project/Category)
- The section includes:
  - A prominent "Upload Receipt" button that accepts images AND PDFs/documents (`accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"`)
  - A secondary "Paste Receipt Text" toggle (same as current)
  - When a file is selected: show preview (image thumbnail or file-type icon for PDFs) with "Scan Receipt" button

**2. Expand file input to accept PDFs and documents**

- Change the hidden file input from `accept="image/*" capture="environment"` to `accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"`
- Add a second file input specifically for mobile camera (`capture="environment"` for photos)
- Show two buttons: "Take Photo" (camera icon, mobile-first) and "Upload File" (upload icon, accepts all)

**3. Smart parsing based on file type**

- If uploaded file is an image: use existing `parse-receipt-image` edge function (base64 flow)
- If uploaded file is a PDF/document: read as base64 and send to `parse-receipt-image` (Gemini 2.5 Pro already handles PDF input via base64)
- Auto-fill all fields from parse result (vendor, amount, date, description, category, expense type) -- same as current image parsing but also wire `suggested_category` and `expenseType` from the image parser response

**4. Wire image parser to also auto-fill category and expense type**

- The `handleParseReceiptImage` function (lines 145-171) currently does NOT set `selectedCategory` or `expenseType` from the image parser response
- Add the same auto-fill logic that the text parser already has

### Layout (top to bottom)

```
[Scan Receipt Section]
  - "Upload Receipt" button (photos + PDFs)
  - "Paste Text" toggle
  - Preview + "Scan" button when file selected

[Project] [Category]     <-- auto-filled after scan
[Type: Product / Labor]  <-- auto-filled after scan
[Amount] [Date]          <-- auto-filled after scan
[Contractor] [Payment]   <-- auto-filled after scan
[Description]            <-- auto-filled after scan
[Tax toggle]
[Total]
[Log Expense]
```

### Technical Details

**File type detection:**
```typescript
const isImage = file.type.startsWith('image/');
// For PDFs/docs, convert to base64 and send to parse-receipt-image
// Gemini 2.5 Pro natively handles PDF base64 input
```

**Image parser auto-fill additions (handleParseReceiptImage):**
```typescript
if (parsed.suggested_category) setSelectedCategory(parsed.suggested_category);
if (parsed.expense_type) setExpenseType(parsed.expense_type as 'product' | 'labor');
```

**parse-receipt-image edge function** -- check if it already returns `suggested_category`; if not, add it to the tool schema (same pattern as parse-receipt-text). This may require a small update to the edge function.

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- reorder form, expand file input, wire auto-fill
- `supabase/functions/parse-receipt-image/index.ts` -- add `suggested_category` and `expense_type` to tool schema if not already present

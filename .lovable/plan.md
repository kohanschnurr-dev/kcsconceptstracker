

## Background Receipt Parsing

### Problem
When a receipt is uploaded, the entire upload + AI parsing + DB insert happens in one async flow inside the React component. If the user navigates away from the Expenses page, the component unmounts and the parsing is abandoned — the receipt is lost.

### Solution
Split the flow into two phases so parsing survives navigation:

1. **Phase 1 (client)**: Upload file to storage, create a `pending_receipts` row with status `'parsing'` and placeholder data, then fire-and-forget the AI parsing call
2. **Phase 2 (edge function)**: The edge function receives a `receipt_id` parameter and updates the DB record directly when parsing completes (or fails)
3. **Client polling**: When the component mounts, `fetchPendingReceipts` already runs — it will pick up `'parsing'` status receipts and show a spinner for them

### Database Changes

**Migration**: No new columns needed. The `status` field already exists as a string — we'll use `'parsing'` as a new status value.

### Code Changes

**1. `supabase/functions/parse-receipt-image/index.ts`**
- Accept an optional `receipt_id` parameter
- When `receipt_id` is provided, update the `pending_receipts` row and insert `receipt_line_items` directly in the edge function (using a service role client)
- On failure, update the receipt status to `'failed'`
- Continue supporting the current flow (without `receipt_id`) for backward compatibility (re-parsing)

**2. `src/components/SmartSplitReceiptUpload.tsx`**
- Modify `handleFileUpload` to:
  - Upload the file to storage
  - Insert a `pending_receipts` row with status `'parsing'`, vendor_name `'Processing...'`, total_amount `0`, purchase_date as today
  - Call the edge function with `receipt_id` + `image_base64` (fire-and-forget — don't await the result)
  - Set `isParsing = false` immediately after launching the background call
- Modify `fetchPendingReceipts` to include `'parsing'` status in the query filter
- Show a "Parsing..." indicator on receipts with status `'parsing'` in the list
- Add a polling interval (every 5s) when any receipt has status `'parsing'` to auto-refresh

**3. Display changes in the receipt list**
- Receipts with `'parsing'` status show a spinner and "Parsing with AI..." text in the Awaiting section
- Once the edge function completes and updates the record to `'pending'`, the next poll picks it up automatically

### Flow

```text
User uploads receipt
  → File uploaded to storage
  → DB row created (status: 'parsing')
  → Edge function called (fire-and-forget)
  → User sees "Parsing..." in receipt list
  → User can navigate away freely

Edge function runs in background
  → AI parses receipt
  → Updates DB row (status: 'pending', fills in vendor/amount/items)
  → OR sets status: 'failed' on error

User returns to Expenses
  → fetchPendingReceipts loads 'parsing' and 'pending' receipts
  → Polling picks up completed results
```

### Key Details
- The edge function needs `SUPABASE_SERVICE_ROLE_KEY` to update DB rows (it already has access to this env var in the Deno runtime)
- Polling stops automatically when no receipts have `'parsing'` status
- The re-parse flow continues to work as before (updates existing row)

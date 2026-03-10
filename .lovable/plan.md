

## Plan: Add Download Receipt Button to Matches Ready for Import + Fix Build Errors

### 1. Add download button to matched receipts (SmartSplitReceiptUpload.tsx)

In the matched receipts section (~line 1107), add a Download button before the Import button, identical to how it's done in the pending receipts section (~line 1201). Only show when `match.receipt.receipt_image_url` exists.

### 2. Fix TypeScript build errors in quickbooks-sync edge function

The `tokenData` is typed as `Record<string, unknown>`, causing all property accesses to be `unknown`. Fix by casting the relevant fields:

- Line 141: `new Date(tokenData.expires_at as string)`
- Line 145: `tokenData.refresh_token as string`
- Line 158: `const realmId = tokenData.realm_id as string;`
- Line 138: `let accessToken = tokenData.access_token as string;`


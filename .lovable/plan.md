
## Fix: PDF Generation Freezing the App

### Root Cause

In `src/lib/pdfExport.ts`, the generated popup window runs `window.print()` automatically via a `<script>` tag after a 600ms timeout. The browser's print dialog is **synchronous and modal** — when it fires, it freezes the JavaScript event loop of the **parent tab** as well, causing the app to appear frozen until the user dismisses the dialog or closes the popup. This is why two refreshes are needed.

### The Fix

Instead of auto-triggering `window.print()` in a popup, switch to a **Blob URL + `<iframe>` print** approach that is completely isolated from the parent tab's thread:

1. Build the HTML string exactly as today
2. Create a `Blob` from it with `text/html` MIME type
3. Create an object URL from the Blob (`URL.createObjectURL`)
4. Open the URL in a new tab with `window.open(blobUrl, '_blank')` — the new tab handles its own print dialog without touching the parent thread

This is the cleanest fix and requires changes only to `src/lib/pdfExport.ts`. No changes to callers (`GenerateInvoiceSheet.tsx`, `GenerateReceiptSheet.tsx`, `ScopeOfWorkSheet.tsx`, `Vendors.tsx`).

### Technical Details

**Current (broken) approach:**
```typescript
const win = window.open('', '_blank');
if (win) {
  win.document.write(html); // writes HTML to blank window
  win.document.close();
  // popup script runs window.print() → freezes parent tab
}
```

**New approach:**
```typescript
const blob = new Blob([html], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const win = window.open(url, '_blank');
// The popup handles its own print() without blocking parent
// Revoke the URL after a short delay to free memory
if (win) {
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
```

The `<script>` inside the HTML still runs `window.print()` in the **popup tab only** — it cannot reach the parent window's event loop when opened from a Blob URL because Blob URL windows are treated as cross-origin by the browser.

### Files to Change

- `src/lib/pdfExport.ts` — only the last 6 lines of the `generatePDF` function (replace `window.open('')` + `document.write` with Blob URL approach)

### What Changes for the User

- Clicking "Generate PDF" opens a new tab with the PDF preview (same as before)
- Print dialog opens automatically in **that tab only**
- The main app tab remains fully responsive — no freeze, no refresh needed
- Closing the PDF tab returns to the app normally

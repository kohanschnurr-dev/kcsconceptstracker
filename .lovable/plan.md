
## Fix: Amazon (and any) Source URL Links Navigating to Project Instead of the Store

### Root Cause

One procurement item in the database has `source_url = "amazon.com/gp/product/B0963M4H4J/..."` — **no `https://` prefix**. When the browser sees `<a href="amazon.com/...">`, it treats it as a **relative URL** and resolves it to `https://kcsconceptstracker.lovable.app/amazon.com/...`. React Router gets that path, doesn't recognize it, and the app either 404s or redirects.

The database query confirms this:
- ✅ Most rows: `https://www.amazon.com/dp/...` — works correctly
- ❌ One row: `amazon.com/gp/product/...` — no protocol, breaks as relative path

This can happen whenever a user pastes a URL without typing `https://` first.

### Two-Part Fix

#### Part 1 — Sanitize `href` at render time (defensive, covers existing bad data)

In every place a `source_url` is rendered as an `<a>` tag, wrap the href to guarantee a protocol prefix:

```tsx
// Helper (inline or shared util)
const safeUrl = (url: string) =>
  url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

// Usage
<a href={safeUrl(item.source_url)} target="_blank" rel="noopener noreferrer">
```

Files to fix:
- `src/pages/Procurement.tsx` — line 632: `href={item.source_url}` → `href={safeUrl(item.source_url)}`
- `src/components/procurement/ProcurementItemDetailModal.tsx` — line 198: `href={item.source_url}`
- `src/components/procurement/OrderRequestsPanel.tsx` — line 63: `href={item.item_source_url}`

#### Part 2 — Sanitize `source_url` before saving (prevents bad data going forward)

In `ProcurementItemModal.tsx`, the `source_url` is set from `urlInput.trim()` in multiple places. Add a small `ensureHttps()` helper and apply it before saving:

```ts
const ensureHttps = (url: string) => {
  if (!url) return url;
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};
```

Apply at all three `setFormData` calls where `source_url` is assigned:
- Line 782: `source_url: ensureHttps(urlInput.trim())`
- Line 893: `source_url: ensureHttps(urlInput.trim())`
- Line 1045: `source_url: ensureHttps(urlInput.trim())`

And when the user manually edits the Source URL input field (line 1363), apply on save (not on every keystroke — so the helper runs in `handleSave`):
- In `handleSave` / `handleUpdate`, sanitize `formData.source_url` before passing to DB

### Files to Modify

| File | Change |
|---|---|
| `src/pages/Procurement.tsx` | Add `safeUrl` helper; apply to `href` at line 632 |
| `src/components/procurement/ProcurementItemDetailModal.tsx` | Apply `safeUrl` to `href` at line 198 |
| `src/components/procurement/OrderRequestsPanel.tsx` | Apply `safeUrl` to `href` at line 63 |
| `src/components/procurement/ProcurementItemModal.tsx` | Add `ensureHttps` helper; apply to all `source_url` setFormData assignments and in save handler |

### What This Fixes

- Existing items with `amazon.com/...` (no protocol) stored in DB will now open Amazon correctly
- Future items saved without `https://` will be auto-corrected before being stored
- No database migration needed — the fix is purely in the frontend render and save paths

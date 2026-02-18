
## Remove the "Scan Receipt" Button from Mobile

### What to Remove

The "Scan Receipt" button is a mobile-only block in `src/components/SmartSplitReceiptUpload.tsx` that renders a full-width camera button above the SmartSplit panel. The user wants it gone since the SmartSplit panel itself already handles receipt uploads.

### Changes (single file: `src/components/SmartSplitReceiptUpload.tsx`)

| Line(s) | What | Action |
|---|---|---|
| 90 | `const mobileScanInputRef = useRef<HTMLInputElement>(null);` | Delete — only used by the button block |
| 935–938 | `handleMobileScan` function | Delete — only used by the button block |
| 942–985 | The entire `{isMobile && (...)}` block (hidden file input + Scan Receipt Button) | Delete |

That's it — 3 small deletions, no logic changes, no other files touched.

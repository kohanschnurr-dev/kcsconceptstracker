

## Add Receipt Photo AI Analysis + Upload Tips Popup

### What This Does

Two additions to the "Add Expense" modal (the Single Expense tab):

1. **Receipt Photo AI Analysis**: When a user uploads a receipt photo via the "Add Receipt Photo" button, the image is sent to the existing `parse-receipt-image` edge function (already built for SmartSplit) to extract vendor, amount, date, and description -- auto-filling the expense form fields. This brings the same AI parsing power from SmartSplit into the quick expense flow.

2. **"Tips for a Good Receipt" Popup**: A one-time guidance dialog that appears the first time a user taps "Add Receipt Photo." It shows simple tips (good lighting, flat surface, full receipt visible, etc.) with a "Don't remind me again" checkbox. The preference is stored in `localStorage` so it never shows again once dismissed.

---

### How It Works

When the user taps "Add Receipt Photo":
1. Check `localStorage` for `kcs-receipt-tips-dismissed`
2. If NOT dismissed, show the tips dialog first. User can check "Don't remind me again" and tap "Got it" to proceed to the camera/file picker
3. If already dismissed, go straight to the file picker
4. After a photo is selected, show a preview AND a "Scan Receipt" button
5. Tapping "Scan Receipt" sends the image to `parse-receipt-image` (same edge function SmartSplit uses)
6. Extracted fields (vendor, amount, date, description, payment method) auto-fill the form
7. A success toast confirms what was extracted

---

### Files to Change

**File 1: `src/components/QuickExpenseModal.tsx`** (ExpenseForm component only)

Changes inside the `ExpenseForm` function:

- Add state: `showReceiptTips` (boolean), `isParsingImage` (boolean)
- Add a `handleReceiptPhotoClick` function that checks localStorage before opening file picker
- Add a `handleParseReceiptImage` function that:
  - Converts the file to base64
  - Calls `supabase.functions.invoke('parse-receipt-image', { body: { image_base64 } })`
  - Auto-fills vendor, amount, date, description, paymentMethod, includeTax from the response
- Replace the simple "Add Receipt Photo" button area (lines 279-295) with:
  - Same file input + preview, but add a "Scan Receipt" button below the preview image
  - The "Add Receipt Photo" button calls `handleReceiptPhotoClick` instead of directly opening the file picker
- Add a small `Dialog` for the receipt tips popup containing:
  - 4-5 short tips with icons (good lighting, lay flat, capture full receipt, avoid glare, ensure text is readable)
  - A checkbox: "Don't remind me again"
  - A "Got it" button that saves the preference to localStorage and opens the file picker

**No new files, no new dependencies, no database changes.**

### Technical Details

Receipt tips dialog structure:
```
Dialog (controlled by showReceiptTips state)
  - Title: "Tips for a Great Receipt Photo"
  - Tip list (4 items with simple bullet icons):
    - Lay the receipt flat on a solid surface
    - Ensure the entire receipt is visible in frame
    - Use good lighting and avoid shadows or glare
    - Make sure all text and numbers are readable
  - Footer:
    - Checkbox + "Don't show this again" label
    - "Got it" button
```

localStorage key: `kcs-receipt-tips-dismissed` (stores `"true"` when checked)

The "Scan Receipt" button appears below the receipt preview image, styled as a secondary action:
```
[receipt preview image]
[X delete] [Sparkles icon] Scan Receipt  (button, calls parse-receipt-image)
```

The auto-fill logic reuses the same field-setting pattern already in `handleParseReceiptText` (lines 88-115), just with the image endpoint instead of text.

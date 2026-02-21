

## Fix: Product Name Linking and Edit Modal Flash

### Problem 1: Product Name Not Clickable
Tapping a product name in the procurement table does nothing. Users expect it to navigate to the product's source URL.

### Problem 2: Edit Button Shows "Add Item" Flash
When clicking the edit pencil icon, the modal briefly flashes the "Add Item - Step 1: Product URL" screen before switching to the edit form. This happens because the modal's initialization logic is inside an async function -- the modal opens immediately with the default `step='url'` state, then the async call completes and switches to `step='details'`.

---

### Technical Details

**Fix 1 -- Clickable Product Name** (`src/pages/Procurement.tsx`)
- Wrap the item name in an anchor tag when `source_url` exists
- Apply the same URL sanitization pattern already used elsewhere (prepend `https://` if no protocol)
- Opens in a new tab; falls back to plain text if no URL

**Fix 2 -- Eliminate Edit Flash** (`src/components/procurement/ProcurementItemModal.tsx`)
- Change the initial `step` state to be derived from the `item` prop: if `item` is provided, start at `'details'` instead of `'url'`
- Move the synchronous `setStep('details')` call out of the async function body so it runs immediately when the modal opens in edit mode
- This eliminates the frame where the "Add Item" URL step is visible

### Files to Change

1. **`src/pages/Procurement.tsx`** (~line 594-596)
   - Make the item name a clickable link to `source_url` when available

2. **`src/components/procurement/ProcurementItemModal.tsx`** (~line 395, 593-663)
   - Initialize `step` based on `item` prop to avoid the flash
   - Set step synchronously before the async bundle-loading begins



## Make "Awaiting Bank Transaction" Section Collapsible

### Problem
Users with many receipts (30+) see a long list of pending receipts that clutters the UI. They need the ability to collapse this section.

### Solution
Add a collapsible toggle to the "Awaiting Bank Transaction" header. Default to expanded. Use a `useState` boolean and a chevron icon to indicate state.

### Changes

**`src/components/SmartSplitReceiptUpload.tsx`**
- Add `awaitingCollapsed` state (default `false`)
- Make the header row clickable with a `ChevronDown`/`ChevronRight` icon
- Wrap the receipt list in a conditional render based on `awaitingCollapsed`
- Show a count badge (e.g., "4 receipts") so users know how many are hidden when collapsed


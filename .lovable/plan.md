

## Plan: Add "All" Pill to Folder Row

### Problem
When a folder is active, the most intuitive action is to look left and click something to clear the filter. Currently users must either re-click the active folder or use the breadcrumb below.

### Change

**`src/pages/Vendors.tsx`** — One small addition to the folders row (around line 296):
- Add an "All" button as the first item after "New Folder" (or before the folder pills)
- It renders as a pill/button matching the folder button style
- Active when `activeFolderId === null`, clicks sets `activeFolderId(null)`
- Shows total vendor count as a badge
- Remove the breadcrumb section (lines 349-361) since the "All" pill serves the same purpose more cleanly

### Result
```text
[+ Folder]  [All (12)]  [🟡 Dallas (4)]  [🔵 Fort Worth (2)]
                ↑ always visible, highlighted when no filter active
```

This is a ~15-line change in one file.


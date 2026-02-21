

## Rename "Vendors" to "Contractors"

### What Changes

All user-facing labels that say "Vendors" will be changed to "Contractors". The URL routes will stay as `/vendors` to avoid breaking bookmarks or links. The database table name (`vendors`) also stays the same -- this is a display-only rename.

### Files to Update

**Navigation (3 files)**
- `src/components/layout/Sidebar.tsx` -- change label from "Vendors" to "Contractors"
- `src/components/layout/MobileNav.tsx` -- same
- `src/components/layout/MobileBottomNav.tsx` -- same

**Vendors page (`src/pages/Vendors.tsx`)**
- Page title: "Vendors" to "Contractors"
- Subtitle: "Manage your contractors" (already correct)
- Search placeholder: "Search vendors..." to "Search contractors..."
- Empty state: "No vendors yet" to "No contractors yet", "No vendors match your search" to "No contractors match your search"
- Add button: "Add Vendor" to "Add Contractor", "Add Your First Vendor" to "Add Your First Contractor"
- PDF header: "VENDOR DIRECTORY" to "CONTRACTOR DIRECTORY", "vendor(s)" to "contractor(s)"
- Toast messages: "Vendor deleted" to "Contractor deleted"
- Delete dialog: "Delete Vendor" to "Delete Contractor"
- Edit button label in contact card: "Edit Vendor" to "Edit Contractor"

**NewVendorModal (`src/components/NewVendorModal.tsx`)**
- Dialog title: "Add Vendor" / "Edit Vendor" to "Add Contractor" / "Edit Contractor"
- Any other user-facing vendor labels inside the modal

No database, route, or backend changes required.



## Vendor Contact Card on Click

When clicking a vendor card, open a read-only contact card dialog showing the vendor's full details.

### UI Design
A `Dialog` opens with the vendor's information displayed cleanly:
- **Name** (large heading) with star rating
- **Phone** (clickable `tel:` link) and **Email** (clickable `mailto:` link)
- **Trades** listed as badges
- **Pricing Model** badge
- **Notes** section (if any)
- **Edit** button at the bottom to switch into the existing edit modal

### Technical Changes

**File: `src/pages/Vendors.tsx`**
- Add `selectedVendor` state (`Vendor | null`)
- Add an `onClick` handler to each vendor card div that sets `selectedVendor` (but not on the dropdown menu area)
- Add a new `Dialog` that shows when `selectedVendor` is set, displaying:
  - Vendor name + star rating at the top
  - Phone as a clickable `tel:` link
  - Email as a clickable `mailto:` link  
  - All trades as badges
  - Pricing model
  - Notes (if present)
  - An "Edit" button that closes this dialog and opens the edit modal
- Stop event propagation on the dropdown menu trigger so clicking the 3-dot menu doesn't also open the contact card

No new components or files needed -- the dialog is small enough to live inline in `Vendors.tsx`.

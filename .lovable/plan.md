

## Make Scope of Work Recipient Universal

### What Changes

Replace the vendor-specific dropdown with a simple free-text "Recipient" input field. The Scope of Work generator should work for anyone -- a contractor giving it to a homeowner, you giving it to a GC, or any other scenario. No vendor selection required.

### Details

- Remove the "Select Vendor" dropdown and the entire Vendor section
- Replace it with a free-text "Recipient" input in the Document Info section (e.g. "John Smith", "ABC Construction", "Homeowner")
- Remove the `vendors` prop from the component entirely (no longer needed)
- Remove the vendor-related state (`selectedVendorId`, `selectedVendor`) and the effect that auto-fills trades from vendor
- The generate button will no longer require a vendor -- it will always be enabled
- In the PDF output, change "Contractor:" to "Recipient:" to keep it universal
- Update both parent usages (`Vendors.tsx` and `DocumentsGallery.tsx`) to stop passing the `vendors` prop

### Technical Details

**`src/components/vendors/ScopeOfWorkSheet.tsx`**

1. Remove `Vendor` interface and `vendors` from `ScopeOfWorkSheetProps`
2. Replace `selectedVendorId` state with a `recipientName` string state
3. Remove the `selectedVendor` lookup and the `useEffect` that syncs trades from vendor
4. Remove the vendor validation in `handleGenerate` -- the button is always enabled
5. Change `Contractor: ${selectedVendor.name}` to `Recipient: ${recipientName}` in PDF output
6. Replace the Vendor section UI with a "Recipient" text input inside the Document Info grid
7. Update reset logic in `handleOpenChange`
8. Remove the `disabled={!selectedVendorId}` from the generate button

**`src/pages/Vendors.tsx`** -- Remove `vendors={vendors}` prop from `<ScopeOfWorkSheet>`

**`src/components/project/DocumentsGallery.tsx`** -- Remove `vendors={...}` prop from `<ScopeOfWorkSheet>`


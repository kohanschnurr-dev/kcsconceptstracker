
## Format Phone Numbers as (xxx) xxx-xxxx

### What Changes
Add a `formatPhone` utility function and apply it everywhere vendor/contractor phone numbers are displayed. Currently raw digits like `9729002165` are shown; they should display as `(972) 900-2165`.

### Where It's Used
Phone numbers appear in 4 files:
1. **`src/pages/Vendors.tsx`** — card view (line 340), detail popover (line 421), and CSV export (line 120)
2. **`src/components/project/ProjectVendors.tsx`** — assigned contractor cards (line 370)
3. **`src/components/dashboard/VendorComplianceTable.tsx`** — compliance table (line 38)

### Technical Details

**New utility in `src/lib/utils.ts`:**
```typescript
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  }
  return phone; // return as-is if non-standard length
}
```

**Then update display locations:**
- `src/pages/Vendors.tsx` — wrap `vendor.phone` and `selectedVendor.phone` display text with `formatPhone()` (keep raw number in `tel:` href)
- `src/components/project/ProjectVendors.tsx` — wrap `pv.vendor.phone` display with `formatPhone()`
- `src/components/dashboard/VendorComplianceTable.tsx` — wrap `vendor.phone` with `formatPhone()`

The `tel:` href links will keep the raw number so dialing still works correctly.

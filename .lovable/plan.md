

## Remove Vendor Placeholder Text

The Vendor input field already starts empty -- the "Home Depot, contrac..." text visible in the screenshot is the placeholder hint, not a default value. You want it to show a blank field on start with no hint text.

### Change

**File: `src/components/QuickExpenseModal.tsx`** (line 300)

- Change the `placeholder` prop on the Vendor input from `"Home Depot, contractor..."` to an empty string or a minimal prompt like `"Vendor name"` (keeping it simple and neutral)
- Specifically: remove the example names so it just says nothing or a generic label

### Technical Detail

One line change:
- Line 300: Change `placeholder="Home Depot, contractor..."` to `placeholder=""`


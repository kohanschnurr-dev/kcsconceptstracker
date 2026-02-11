

## Add Star Indicator to Active Color Palette

### What Changes
A filled star icon will appear on the currently selected (active) palette card, giving a clear visual cue of which theme is the user's preset. The star disappears from the old card and appears on the new one when a different palette is selected. The selection already persists in localStorage, so no backend changes are needed.

### Technical Details

**File: `src/components/settings/ColorPaletteCard.tsx`**

1. Import `Star` from `lucide-react`
2. Inside each palette button, add a small filled `Star` icon in the top-right corner, only rendered when `isActive` is true
3. Position it with `absolute` inside the button (make button `relative`)
4. Star styling: small (w-4 h-4), filled with primary color, subtle drop shadow

No other files need changes. The palette persistence logic already works via localStorage.


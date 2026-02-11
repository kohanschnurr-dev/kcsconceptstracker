

## Reorder Color Palettes: Light Themes Last

### Change

Reorder the `palettes` array in `src/lib/colorPalettes.ts` so the three light-background palettes -- **Ivory**, **Pearl**, and **Linen** -- appear at the end of the list.

### New Order

1. Ember
2. Graphite
3. Slate
4. Onyx
5. Titanium
6. Midnight
7. Cobalt
8. Ivory
9. Pearl
10. Linen

### Technical Details

**File: `src/lib/colorPalettes.ts`**

- Move the Ivory, Pearl, and Linen palette objects to positions 8-10 in the `palettes` array
- No other changes needed -- the grid layout and selection logic remain the same


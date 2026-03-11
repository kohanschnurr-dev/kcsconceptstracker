

## Plan: Add Neutral Theme Color to Folder Presets

Add a muted gray/neutral color as the first option in the preset colors list so users can create folders that blend with the dark theme instead of standing out with a bright color.

### Change

**`src/components/vendors/CreateVendorFolderModal.tsx`**
- Add `{ name: 'Neutral', value: '#6b7280' }` (Tailwind gray-500) as the first item in `PRESET_COLORS`
- Set the default `color` state to this neutral value so new folders default to the subdued option

One-line addition, one-line default change.


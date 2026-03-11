

## Plan: Use Theme Primary Color for Active Folder Highlighting

The active folder pills should use the theme's primary color (set in Settings > Color Palette) instead of their own folder color for the highlight state. The "All" pill already uses `variant="default"` which maps to `bg-primary`, so it should already be gold — if it appears purple, something else may be off. But the folder pills override with inline `backgroundColor: folder.color` when active, which bypasses the theme.

### Change

**`src/pages/Vendors.tsx`** (~5 lines changed)

- **Active folder pills**: Remove the inline `style` that sets `backgroundColor` and `borderColor` to the folder's color. Instead, let them use `variant="default"` which applies `bg-primary text-primary-foreground` — the theme color from settings.
- **Folder icon color**: When active, the folder icon keeps the folder's own color for identity; when inactive, same as now.
- **Ring color on active**: Remove inline ring color, let it inherit from theme (`ring-primary`).
- The "All" pill already uses `variant="default"` so no change needed there — it should pick up the theme primary automatically.

Result: All active pills (both "All" and folder pills) will highlight in the theme's primary color (gold by default), while the folder icon retains the folder's assigned color for visual identity.


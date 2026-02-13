

## Clean Up Today's Agenda Banner

### What Changes
**File: `src/components/dashboard/TasksDueTodayBanner.tsx`**

Tighten the three-box grid to feel more compact and polished:

1. **Reduce box height** from `min-h-[120px]` to `min-h-[100px]` — less dead space
2. **Shrink icons** from `h-8 w-8` to `h-6 w-6` — they dominate too much currently
3. **Remove `mb-2`** from icons and use consistent `gap` via the flex column instead
4. **Add `gap-2`** to the flex-col containers so spacing is uniform between icon, text, and button
5. **Remove redundant `mt-auto`** wrapper divs — use `flex-1` on the middle content area to naturally push buttons down
6. **Reduce outer padding** from `p-4` to `p-3` on the main container and `mb-3` to `mb-2` on the header for a tighter feel

### Technical Details

The three boxes will each follow this streamlined structure:
```
flex flex-col items-center gap-2 min-h-[100px]
  Icon (h-6 w-6)
  Content area (flex-1, centered)
  Button (w-full, anchored bottom)
```

Key class changes per box:
- Container: `min-h-[120px]` → `min-h-[100px]`, add `gap-2`
- Icons: `h-8 w-8 mb-2` → `h-6 w-6` (no margin, gap handles spacing)
- Remove wrapper `<div className="mt-auto w-full">` around buttons — instead put `mt-auto` directly on the Button
- Content text divs get `flex-1` to fill middle space

Overall container: `p-4` → `p-3`, header `mb-3` → `mb-2`


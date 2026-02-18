
## Fix Notifications Panel — Cover the Full Left Side Including Sidebar

### Problem
The notifications `SheetContent` currently has `ml-16` applied, which pushes the panel 64px to the right to avoid overlapping the sidebar. This leaves the sidebar icons visible behind/beside the panel — which is exactly what the user **doesn't** want. The user wants the panel to slide in from the far left edge, covering the sidebar area.

### Solution
One-line change in `src/components/layout/NotificationsPanel.tsx` line 221:

```tsx
// Before
<SheetContent side="left" className="w-80 p-0 flex flex-col ml-16">

// After
<SheetContent side="left" className="w-96 p-0 flex flex-col">
```

Changes:
- **Remove `ml-16`** — panel now anchors to the very left edge of the screen (x=0), sliding over the sidebar
- **Increase width from `w-80` (320px) to `w-96` (384px)** — since it now covers the sidebar (64px) too, the extra width ensures the readable content area inside the panel is still ~320px wide after accounting for the sidebar underneath

### Visual Result

```
Before:
┌──────────┬────────────────────────┐
│ Sidebar  │ Notifications Panel    │
│  icons   │ (starts at px 64)      │
│ visible  │                        │
└──────────┴────────────────────────┘

After:
┌────────────────────────────────────┐
│ Notifications Panel                │
│ (starts at px 0, covers sidebar)   │
│                                    │
└────────────────────────────────────┘
```

The panel slides in from the very left edge, covering the sidebar entirely — clean, full-height drawer behavior matching common mobile/desktop notification drawer patterns.

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/NotificationsPanel.tsx` | Line 221: remove `ml-16`, change `w-80` → `w-96` |

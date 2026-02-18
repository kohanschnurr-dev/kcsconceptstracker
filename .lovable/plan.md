
## Fix: Move Team Messages Panel to Bottom Right, Covering the FAB When Open

### Problem
The panel is currently positioned at `bottom-20 right-6 lg:right-auto lg:left-[72px]` — on desktop this anchors it to the far left (just past the sidebar), which is wrong. The user wants:
1. The panel anchored to the **bottom right corner** (same side as the FAB)
2. When the panel is open, it should **cover the FAB** (sit over it, not above it)

### Solution

Two changes in `src/components/layout/FloatingMessageBubble.tsx`:

**1. Reposition the panel to bottom-right and cover the FAB**

Currently the panel sits `bottom-20` (above the FAB). Instead:
- Change to `bottom-6 right-6` — same position as the FAB
- This makes the panel sit directly **on top of** the FAB button when open, covering it completely
- Remove all the `lg:left-[72px]` and `lg:right-auto` overrides — keep it right-anchored always

**2. Restore the animation origin to bottom-right**

Remove `lg:origin-bottom-left` since the panel is now right-anchored again. Keep `origin-bottom-right` so it scales from the FAB position.

### Visual Result

```
Before (open):
┌──────────────┐
│ Team Messages│  ← panel at bottom-20 right-6 (above FAB)
└──────────────┘
       [FAB]       ← FAB still visible below panel at bottom-6 right-6

After (open):
┌──────────────┐
│ Team Messages│
│              │
│              │
│   (FAB is    │
│   covered)   │
└──────────────┘  ← panel at bottom-6 right-6, same spot as FAB
```

The panel completely overlays the FAB area — clean, familiar chat app UX (like WhatsApp Web, Intercom, etc).

### Exact Code Changes

**Panel div** (lines 211-214):
```tsx
// Before
'fixed z-[60] transition-all duration-200 origin-bottom-right lg:origin-bottom-left',
'bottom-20 right-6 lg:right-auto lg:left-[72px]',

// After
'fixed z-[60] transition-all duration-200 origin-bottom-right',
'bottom-6 right-6',
```

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/FloatingMessageBubble.tsx` | Lines 212–213: simplify panel position to `bottom-6 right-6`, remove `lg:` overrides, restore `origin-bottom-right` |

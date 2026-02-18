
## Fix: Shift Floating Message Bubble Away from Sidebar

### Problem
The FAB sits at `right-6` (24px from screen right) and the panel at `right-6` with `w-80` (320px). On desktop the sidebar is only 64px wide on the left — the issue isn't left overlap but that the panel opens over the main content area in a way that visually bleeds onto the sidebar. Looking at the screenshot, the panel is anchored to the right but the user wants it shifted further left so it clears the content better.

The real fix: the panel needs to be **wider** and positioned **further from the right edge** so it sits cleanly in the main content area. The current `w-80` (320px) is relatively narrow — bumping to `w-96` (384px) and shifting the right anchor to something like `right-6 lg:right-8` while also adjusting the `origin` makes it feel more intentional.

However, looking at the screenshot more carefully — the panel is opening over the sidebar icons. The fix is to add `lg:right-8` offset to both the FAB and panel to push them into the main content area (away from the left sidebar), but the user said "go further to the left" — meaning they want the panel to open more toward the left side of the screen, not just the right edge.

The best approach: change the panel's **left anchor strategy** — instead of `right-6`, use `left-1/2 -translate-x-1/2` on mobile and on desktop use a fixed left offset from the sidebar `lg:left-24` so it doesn't obscure the sidebar. Or more simply: position the panel to **open from the FAB upward and leftward** using `right` offset that matches the sidebar width + some padding.

### What to Change

**`src/components/layout/FloatingMessageBubble.tsx`** — two edits:

1. **Panel div** — change from `bottom-20 right-6` to position it further left. Use `bottom-20 right-6 lg:left-20 lg:right-auto` so on desktop it anchors from the **left** side (just past the sidebar at 64px = `ml-16`), giving it the full width of the content area to expand into. Set `origin-bottom-left` on desktop.

   Actually the cleanest approach is: keep `right-6` for mobile, but on `lg:` use `lg:right-auto lg:left-20` which anchors the panel just to the right of the sidebar. Width stays `w-80` but now it opens into the content area rather than the right edge.

2. **FAB button** — stays `fixed bottom-6 right-6` (it's fine on right edge), but the **panel** shifts to open from the left of the FAB toward the center.

   Even simpler: just change `right-6` on the panel to `right-20 lg:right-auto lg:left-[76px]` — panel anchors to just after the sidebar.

### Concrete Change

**Panel positioning** (line 212-214 area):
```
// Before
'bottom-20 right-6',

// After  
'bottom-20 right-6 lg:right-auto lg:left-[72px]',
```
And change `origin-bottom-right` → `origin-bottom-left` on desktop:
```
// Before
'fixed z-[60] transition-all duration-200 origin-bottom-right',

// After
'fixed z-[60] transition-all duration-200 origin-bottom-right lg:origin-bottom-left',
```

This anchors the panel just 72px from the left (right after the 64px sidebar) on desktop, so it opens **into the main content area** from the left side — no sidebar overlap, plenty of room, and the FAB button stays in its familiar bottom-right corner position.

The panel width stays `w-80` which is 320px — enough to be usable, and it won't conflict with the sidebar since it starts at `left-[72px]`.

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/FloatingMessageBubble.tsx` | Change panel `right-6` to `lg:right-auto lg:left-[72px]` and add `lg:origin-bottom-left` |

This is a one-line positioning change — no logic changes needed.

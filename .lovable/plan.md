
## Make Project Detail Tabs Swipeable on Mobile

### What the User Wants

The screenshot shows the project detail tab bar on mobile with scroll arrows at the bottom. The user wants to swipe left/right on the tab content area to navigate between tabs — a standard mobile UX pattern (like native apps).

### Approach

Add a touch swipe handler directly on the `<Tabs>` wrapper in `ProjectDetail.tsx`. No new library needed — use native `touchstart`/`touchend` events via React's `onTouchStart`/`onTouchEnd` props. When a horizontal swipe is detected (>50px horizontal movement, less than 100px vertical to avoid conflict with vertical scrolling):

- Swipe left → go to next tab
- Swipe right → go to previous tab

The active tab index is determined from `effectiveTabOrder` and the current `activeTab` value, so navigation wraps around the ordered list correctly.

### Implementation

**File:** `src/pages/ProjectDetail.tsx`

**1. Add touch state refs** (just above or near the `activeTab` state, ~line 223):
```tsx
const touchStartX = useRef<number>(0);
const touchStartY = useRef<number>(0);
```

**2. Add swipe handler** (near the other handlers, e.g. after `handleTabDragEnd`):
```tsx
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
  touchStartY.current = e.touches[0].clientY;
};

const handleTouchEnd = (e: React.TouchEvent) => {
  const dx = e.changedTouches[0].clientX - touchStartX.current;
  const dy = e.changedTouches[0].clientY - touchStartY.current;
  // Only trigger on clearly horizontal swipe (>50px horizontal, less vertical than horizontal)
  if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
  const currentIndex = effectiveTabOrder.indexOf(activeTab || effectiveTabOrder[0]);
  if (dx < 0) {
    // Swipe left → next tab
    const next = effectiveTabOrder[Math.min(currentIndex + 1, effectiveTabOrder.length - 1)];
    setActiveTab(next);
  } else {
    // Swipe right → previous tab
    const prev = effectiveTabOrder[Math.max(currentIndex - 1, 0)];
    setActiveTab(prev);
  }
};
```

**3. Attach handlers to the `<Tabs>` wrapper div** (line ~1045):
```tsx
<Tabs
  value={activeTab || effectiveTabOrder[0]}
  onValueChange={setActiveTab}
  className="space-y-4"
>
  {/* wrap the tab content area with touch handlers */}
  <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
    ...all TabsContent panels...
  </div>
```

The `onTouchStart`/`onTouchEnd` handlers are placed on a `<div>` wrapping **only the TabsContent panels** (not the tab bar itself), so the swipe area is the content below the tabs. The tab bar stays as-is and continues to horizontally scroll.

### Why No Library

Touch events are available natively. Adding `embla-carousel` or `react-swipeable` just to detect left/right swipes on an existing Radix Tabs setup would add complexity — simple `touchstart`/`touchend` math is reliable, performant, and dependency-free.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/ProjectDetail.tsx` | Add 2 `useRef` for touch tracking. Add `handleTouchStart` + `handleTouchEnd` functions. Wrap all `<TabsContent>` panels in a `<div>` with those handlers attached. |

No new dependencies. No other files needed.

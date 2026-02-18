
## Add Click-Outside Backdrop to Close Team Messages Panel

### Problem
When the Team Messages panel is open, clicking anywhere outside of it passes straight through to the underlying page (tabs, cards, buttons, etc.). The user wants clicking outside to:
1. Close the panel
2. NOT trigger whatever is underneath (the click should be "consumed")

### Solution
Add a full-screen invisible backdrop `<div>` that sits behind the panel but above the page content. When clicked, it calls `handleClose()` and stops the event from propagating to the page.

This is the same pattern used by modals, dropdowns, and drawers everywhere — a transparent overlay that intercepts clicks outside the floating element.

### Visual Behavior

```
Before (click outside):
┌─────────────────────────────────────┐
│  Page content (clickable!)          │
│                        ┌──────────┐ │
│   [user clicks here]   │  Panel   │ │
│        ↓               │          │ │
│   Accidentally clicks  └──────────┘ │
│   a tab / button / card             │
└─────────────────────────────────────┘

After (click outside):
┌─────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← invisible backdrop z-[59]
│  ░  [user clicks here]  ░┌────────┐ │
│  ░        ↓             ░│ Panel  │ │  ← panel z-[60]
│  ░   Backdrop catches   ░│        │ │
│  ░   click → closes     ░└────────┘ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────┘
```

### Exact Code Change

In `src/components/layout/FloatingMessageBubble.tsx`, inside the returned JSX (after the `<>` opening fragment), add a backdrop div **before** the panel div:

```tsx
{/* Backdrop — closes panel on outside click, blocks pass-through */}
{isOpen && (
  <div
    className="fixed inset-0 z-[59]"
    onClick={handleClose}
    aria-hidden="true"
  />
)}
```

- `fixed inset-0` — covers the entire viewport
- `z-[59]` — sits just below the panel (`z-[60]`) but above all page content
- `onClick={handleClose}` — closes the panel when clicked
- No background color — completely invisible, just an event trap
- `isOpen &&` — only mounted when the panel is visible (no cost when closed)

### Why This Works
- The backdrop sits between the page and the panel in z-order
- Clicking the panel itself works normally (panel is `z-[60]`, above the backdrop)
- Clicking anywhere outside the panel hits the backdrop first, fires `handleClose()`, and the event stops — the page never sees the click

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/FloatingMessageBubble.tsx` | Add invisible backdrop `<div>` before the panel div, rendered only when `isOpen` is true |

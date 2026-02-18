
## Hide FAB Button When Panel Is Open

### Problem
As shown in the screenshot, the FAB button remains visible in the bottom-right corner even when the Team Messages panel is open and covering that same area. The user wants the FAB to disappear when the panel is pulled up.

### Solution
In `src/components/layout/FloatingMessageBubble.tsx`, add a conditional visibility class to the FAB button so it hides when `isOpen` is `true`.

The FAB button is rendered after the panel div (around line 240+). It currently always renders. We just need to add `isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'` to its className so it fades out when the panel is open.

### Exact Code Change

**FAB button** — add conditional opacity based on `isOpen`:

```tsx
// Before
className={cn(
  'fixed bottom-6 right-6 z-[60]',
  'h-14 w-14 rounded-full shadow-lg',
  'bg-primary text-primary-foreground',
  'flex items-center justify-center',
  'transition-all duration-200 hover:scale-110 active:scale-95',
  hasUnread && 'animate-pulse'
)}

// After
className={cn(
  'fixed bottom-6 right-6 z-[60]',
  'h-14 w-14 rounded-full shadow-lg',
  'bg-primary text-primary-foreground',
  'flex items-center justify-center',
  'transition-all duration-200 hover:scale-110 active:scale-95',
  hasUnread && 'animate-pulse',
  isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
)}
```

The `scale-75` + `opacity-0` gives a subtle shrink-fade effect as the panel opens, and `pointer-events-none` ensures the hidden button can't be accidentally clicked.

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/FloatingMessageBubble.tsx` | Add `isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'` to FAB button className |

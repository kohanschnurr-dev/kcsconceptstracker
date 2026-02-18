
## Hide Tab Reorder Gear on Mobile

### What & Why

The gear icon (⚙) next to the tab bar opens a drag-to-reorder popover for rearranging tabs. On mobile, the tab bar already scrolls horizontally — the tab order is carried over from whatever the user set on desktop (it's stored in the user profile), so the gear provides no unique value on a small screen and wastes precious horizontal space.

### The Fix

**File:** `src/pages/ProjectDetail.tsx` — lines 1056–1072

The `<Popover>` that contains the gear button and the entire drag-to-reorder panel simply needs `hidden sm:flex` (or `hidden sm:block`) so it disappears on mobile and reappears on `sm:` and above.

```tsx
// Before (line 1056):
<Popover open={reorderOpen} onOpenChange={setReorderOpen}>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
      <Settings className="h-4 w-4 text-muted-foreground" />
    </Button>
  </PopoverTrigger>
  ...
</Popover>

// After: wrap in a hidden-on-mobile container
<div className="hidden sm:block shrink-0">
  <Popover open={reorderOpen} onOpenChange={setReorderOpen}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Settings className="h-4 w-4 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    ...popover content unchanged...
  </Popover>
</div>
```

The tab order (set on desktop) is already persisted to the user profile and read via `getDetailTabOrder` — mobile automatically inherits it. No logic changes needed.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/ProjectDetail.tsx` | Wrap the `<Popover>` (gear button + reorder panel, lines 1056–1072) in `<div className="hidden sm:block shrink-0">` |

One wrapper `<div>`. No logic, no data, no other files.

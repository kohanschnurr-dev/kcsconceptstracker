

## Fix: Project Autocomplete Dropdown Clipped Behind UI Elements

### Problem
In the Budget Calculator's "Apply" tab (inside the Deal Sidebar), the project search dropdown gets clipped/hidden behind other page elements. This happens because the sidebar has scrollable overflow, which creates a clipping boundary for the popover.

### Solution
Update the `ProjectAutocomplete` component's `PopoverContent` to use `portal` container rendering and set a higher z-index. This ensures the dropdown renders at the document root level, escaping any overflow clipping from parent containers.

### Technical Detail

**File: `src/components/ProjectAutocomplete.tsx`** (line 118-123)

Add `sideOffset` and ensure the popover escapes overflow containers by default:

```tsx
<PopoverContent 
  className={cn(
    'w-[--radix-popover-trigger-width] p-0 bg-popover border-border z-[200]',
    className
  )}
  align="start"
  sideOffset={4}
>
```

The key change is bumping `z-50` to `z-[200]` so the dropdown renders above all page content including sidebars and modals. The Radix `Popover` already portals to the document body by default, so the main issue is z-index stacking.

### Files
- **Edit**: `src/components/ProjectAutocomplete.tsx` -- Increase z-index on PopoverContent


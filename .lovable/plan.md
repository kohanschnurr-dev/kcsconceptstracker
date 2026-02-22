

## Fix "Adjusted" Tooltip Not Showing on Hover

### Problem
The tooltip on the "Adjusted" badge doesn't appear when hovering. This is because `TooltipTrigger asChild` passes ref and event handlers to the child component, but `Badge` (a styled `div`) may not properly handle the pointer events needed for the tooltip to trigger.

### Fix
**File: `src/components/SmartSplitReceiptUpload.tsx`** (line 1312)

Remove `asChild` from `TooltipTrigger` so it wraps the Badge in its own interactive element, or wrap the Badge in a `<span>` that properly receives hover events.

The simplest fix: remove `asChild` from the `TooltipTrigger` on line 1312. This lets Radix render its own wrapper `button` element around the badge, which correctly handles hover/focus events for the tooltip.


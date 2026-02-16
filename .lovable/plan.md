

## Improve Info Tooltip UX on SmartSplit Header

### Problem
The current tooltip floats awkwardly above the SmartSplit header, especially on mobile where hover isn't natural. The positioning looks off and the interaction isn't mobile-friendly.

### Solution
Replace the `Tooltip` with a `Popover` component. Popovers are tap-to-open (mobile-friendly) and visually anchor better. The info icon stays the same, but tapping/clicking it opens a small card-style popover instead of a hover tooltip.

### Technical Details

**File: `src/components/SmartSplitReceiptUpload.tsx`**

1. Replace `Tooltip`/`TooltipProvider`/`TooltipTrigger`/`TooltipContent` imports with `Popover`/`PopoverTrigger`/`PopoverContent` (already used elsewhere in the project).

2. Replace the tooltip block (lines 998-1008) with a Popover:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
  </PopoverTrigger>
  <PopoverContent side="right" align="start" className="max-w-xs text-sm p-3">
    <p>Allow time for receipts to parse after uploading.</p>
    <p className="mt-1">Upload clear, high-quality PDFs or photos for best parsing accuracy.</p>
  </PopoverContent>
</Popover>
```

3. Remove the unused Tooltip imports if no longer needed elsewhere in the file.

One file change. Swaps tooltip for popover -- better positioning and tap-friendly on mobile.



## Switch Info Icon Back to Hover Tooltip

### Change
Revert the Popover back to a Tooltip so the info appears on hover instead of click. Keep the same content and styling.

### Technical Details

**File: `src/components/SmartSplitReceiptUpload.tsx`**

1. Replace `Popover`/`PopoverContent`/`PopoverTrigger` imports with `Tooltip`/`TooltipContent`/`TooltipProvider`/`TooltipTrigger` from `@/components/ui/tooltip`.

2. Replace the Popover block (lines 998-1005) with:

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent side="right" align="start" className="max-w-xs text-sm p-3">
      <p>Allow time for receipts to parse after uploading.</p>
      <p className="mt-1">Upload clear, high-quality PDFs or photos for best parsing accuracy.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Key difference from the original attempt: using `side="right"` and `align="start"` instead of `side="top"` for better positioning that won't overlap the header.


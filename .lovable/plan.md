

## Add Info Tooltip to SmartSplit Receipt Matching Header

### What Changes
Add an info icon (circle with "i") next to the "SmartSplit Receipt Matching" title that shows helpful tips on hover about receipt parsing.

### Tooltip Content
- "Allow time for receipts to parse after uploading."
- "Upload clear, high-quality PDFs or photos for best parsing accuracy."

### Technical Details

**File: `src/components/SmartSplitReceiptUpload.tsx`**

1. Import `Info` icon from `lucide-react` and `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider` from the existing tooltip component.

2. Around line 995-997, add an `Info` icon wrapped in a Tooltip next to the "SmartSplit Receipt Matching" text:

```tsx
<h3 className="font-medium flex items-center gap-2">
  SmartSplit Receipt Matching
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-sm">
        <p>Allow time for receipts to parse after uploading.</p>
        <p className="mt-1">Upload clear, high-quality PDFs or photos for best parsing accuracy.</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</h3>
```

One file, small addition. Uses existing tooltip and icon components already in the project.

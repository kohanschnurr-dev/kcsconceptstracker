

## Add Ctrl+V Paste Indicator to Photos Section

### What Changes
In `src/components/dashboard/AddTaskDialog.tsx`, add a visual hint and a third button/label for the Ctrl+V paste option in the Photos upload area, so users know they can paste images directly.

### Changes in `src/components/dashboard/AddTaskDialog.tsx`

**1. Add `Clipboard` to the lucide imports (line 7)**

**2. Add a hint row below the two buttons (after line 190)**

Add a small text hint with the clipboard icon, similar to the pattern used in `PasteableTextarea`:

```
<p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2">
  <Clipboard className="h-3 w-3" />
  Paste images with Ctrl+V or drag & drop
</p>
```

This sits inside the dashed-border container so it's clear paste/drop targets the photo area.

### Files Changed
- `src/components/dashboard/AddTaskDialog.tsx`

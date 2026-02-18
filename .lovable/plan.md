
## Add Screenshot Tip to Product Image Upload Area

### What to Change

In `src/components/procurement/ProcurementItemModal.tsx`, line 1322, the current hint text reads:

```
Ctrl+V to paste
```

Replace it with a two-line tip that guides users to use the Windows Snipping Tool shortcut first, then paste:

```
Win + Shift + S to snip, then Ctrl+V to paste
```

This gives users a clear, actionable workflow when the scraper misses the product image.

### Exact Change

**File**: `src/components/procurement/ProcurementItemModal.tsx`  
**Line**: 1322

**Before:**
```tsx
<p className="text-xs text-muted-foreground mt-1">Ctrl+V to paste</p>
```

**After:**
```tsx
<p className="text-xs text-muted-foreground mt-1">
  <span className="font-medium">Win + Shift + S</span> to snip screen, then <span className="font-medium">Ctrl+V</span> to paste
</p>
```

This renders cleanly inside the existing upload drop zone, using `font-medium` on the keyboard shortcuts to make them visually distinct — matching the style of the existing UI.

### Visual Result

```
        ↑
Drop image or click to browse
Win + Shift + S to snip screen, then Ctrl+V to paste
```

No layout changes needed — it's a single text update inside the existing hint paragraph.

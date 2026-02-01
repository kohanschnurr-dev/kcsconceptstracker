
## Plan: Restrict Row Click to External Link Button Only

### Problem
Currently, clicking anywhere on a table row in the Bundle Detail view opens the product's source URL. The user wants this behavior limited to only the orange external link button next to the store name.

### Solution
Remove the `onClick` handler and `cursor-pointer` styling from the `TableRow`, keeping the functionality only on the existing `<a>` tag with the `ExternalLink` icon.

### Changes

**File: `src/pages/BundleDetail.tsx`**

| Line | Current | New |
|------|---------|-----|
| 456-463 | `TableRow` with `onClick` and conditional `cursor-pointer` | Plain `TableRow` with just `hover:bg-muted/30` |

**Before (lines 456-463):**
```tsx
<TableRow 
  key={item.id} 
  className={item.source_url ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/30"}
  onClick={() => {
    if (item.source_url) {
      window.open(item.source_url, '_blank', 'noopener,noreferrer');
    }
  }}
>
```

**After:**
```tsx
<TableRow 
  key={item.id} 
  className="hover:bg-muted/30"
>
```

### What stays the same
The existing external link button (lines 489-499) already works independently:
```tsx
{item.source_url && (
  <a 
    href={item.source_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-primary hover:text-primary/80"
    onClick={(e) => e.stopPropagation()}
  >
    <ExternalLink className="h-3 w-3" />
  </a>
)}
```

This anchor tag will continue to function as expected, and we can remove the `stopPropagation` since there's no longer a parent click handler to stop.

### Result
- Clicking the row: No action (allows easy quantity editing, etc.)
- Clicking the orange external link icon: Opens the product URL in a new tab

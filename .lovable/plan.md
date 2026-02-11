

## Fit 3 Active Projects Per Row

### Change
Update the project grid in `src/pages/Index.tsx` (line 287) from a 2-column layout to a 3-column layout on large screens:

```
// Before
grid grid-cols-1 md:grid-cols-2 gap-4

// After
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
```

This single class addition makes 3 project cards fit on one row at desktop widths (1024px+), keeping 2 columns on medium screens and 1 on mobile. The cards will naturally shrink to fit, making the cover photos and content more compact.


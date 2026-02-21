

## Fix Export Reports Dialog Alignment

### Problem
The Export Reports dialog has a nested Card-within-Dialog layout causing:
- Redundant double header (Dialog title "Export Reports" + Card title "Export Reports")
- Extra padding/borders from the Card wrapper inside the dialog
- The three export option cards have uneven heights because the description text wraps differently

### Changes

**`src/components/project/ExportReports.tsx`**

1. Remove the outer `Card`, `CardHeader`, `CardTitle`, `CardDescription`, and `CardContent` wrappers -- just render the content directly as a `div` since this component now lives inside a Dialog that provides its own header/chrome
2. Add `h-full` to each of the three option cards so they stretch to equal height within the grid
3. Remove unused `Card`-related imports

The returned JSX will change from:
```
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>
    <grid of 3 cards>
    <footer row>
  </CardContent>
</Card>
```

To:
```
<div className="space-y-4">
  <p>Download project data...</p>
  <grid of 3 equal-height cards>
  <footer row>
</div>
```

### Files Changed
- `src/components/project/ExportReports.tsx` -- remove Card wrapper, equalize option card heights

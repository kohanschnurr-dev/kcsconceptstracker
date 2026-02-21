

## Replace Download Icon in Export Reports Dialog Header

### What's Changing

The download arrow icon next to "Export Reports" in the dialog header will be replaced with a `FileText` icon, which better represents report generation rather than downloading.

### Technical Details

**`src/pages/ProjectBudget.tsx`** (line 1624)

Change the DialogTitle from:
```tsx
<DialogTitle>Export Reports</DialogTitle>
```

To include a `FileText` icon (already imported):
```tsx
<DialogTitle className="flex items-center gap-2">
  <FileText className="h-5 w-5" />
  Export Reports
</DialogTitle>
```

`FileText` is already imported in this file (line 17), so no new imports are needed.

### Files Changed
- `src/pages/ProjectBudget.tsx` -- update DialogTitle with FileText icon


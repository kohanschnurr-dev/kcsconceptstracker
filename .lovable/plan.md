

## Add "Best for Bulk" Helper Text to Import CSV Tab

### What's Changing
Below the "Select a project above to begin importing expenses" message, add a visually appealing helper note indicating that the Import CSV tab is best suited for adding many expenses at once. This gives users context about when to use this tab vs. the single expense form.

### Technical Detail

**File: `src/components/QuickExpenseModal.tsx`**

Update the empty-state block (lines 439-443) that shows when no project is selected. Replace the plain text with a more informative layout:

```tsx
{!selectedProject && (
  <div className="text-center py-8 space-y-3">
    <p className="text-muted-foreground text-sm">
      Select a project above to begin importing expenses.
    </p>
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium">
      <FileSpreadsheet className="h-3.5 w-3.5" />
      Best for adding numerous expenses at once
    </div>
  </div>
)}
```

This adds a styled pill/badge below the instruction text with a spreadsheet icon and the helper message, using the existing `FileSpreadsheet` icon (already imported via lucide-react in the file) and the app's primary color for a polished look.

### Files
- **Edit**: `src/components/QuickExpenseModal.tsx` -- Update the no-project-selected empty state (lines 439-443)

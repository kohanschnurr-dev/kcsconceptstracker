

## Fix: Completion Date Picker Disappearing

### Problem
When clicking "Complete" in the status dropdown, the dropdown closes and a `Popover` tries to open. But the Popover is anchored to an invisible `<span />` with no size or position, so the calendar either appears incorrectly or is hidden.

### Solution
Replace the `Popover` with a `Dialog` for the completion date picker. A Dialog doesn't need an anchor element -- it opens as a centered overlay, which is more reliable and better UX.

### Technical Details

**File: `src/pages/ProjectDetail.tsx`**

1. Replace the `Popover`/`PopoverTrigger`/`PopoverContent` imports with `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle` (already imported from alert-dialog, so just add the regular dialog imports).

2. Replace the Popover block (lines 589-601) with a Dialog:
```tsx
<Dialog open={completionDateOpen} onOpenChange={setCompletionDateOpen}>
  <DialogContent className="w-auto max-w-fit p-6">
    <DialogHeader>
      <DialogTitle>Select Completion Date</DialogTitle>
    </DialogHeader>
    <CalendarComponent
      mode="single"
      selected={new Date()}
      onSelect={(date) => date && handleCompleteWithDate(date)}
      className={cn("p-3 pointer-events-auto")}
    />
  </DialogContent>
</Dialog>
```

3. Remove the now-unused Popover imports if they are no longer used elsewhere in the file.

### Files Modified
- `src/pages/ProjectDetail.tsx` -- replace Popover with Dialog for completion date picker

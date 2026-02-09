

## Replace Native Date Input with Calendar Picker for Start Date

### Overview

Replace the native HTML `<input type="date">` for "Start Date" in the New Project modal with a Shadcn Calendar Popover date picker for a better, more consistent UI experience.

### Technical Changes

**File: `src/components/NewProjectModal.tsx`**

1. **Add imports**: Import `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`, `Calendar` from `@/components/ui/calendar`, `format` from `date-fns`, and `cn` from `@/lib/utils`.

2. **Update state**: Change `startDate` from a string (`formatDateString(new Date())`) to a `Date` object (`new Date()`). Update the reset in `handleSubmit` accordingly.

3. **Update the insert call**: Convert the Date back to a string for the database using `formatDateString(startDate)`.

4. **Replace the Start Date input** with a Popover + Calendar picker:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className={cn(
        "w-full pl-9 justify-start text-left font-normal",
        !startDate && "text-muted-foreground"
      )}
    >
      <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground" />
      {startDate ? format(startDate, "MM/dd/yyyy") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    <Calendar
      mode="single"
      selected={startDate}
      onSelect={(date) => date && setStartDate(date)}
      initialFocus
      className="p-3 pointer-events-auto"
    />
  </PopoverContent>
</Popover>
```

### Summary

| Area | Change |
|------|--------|
| Imports | Add Popover, Calendar (shadcn), format, cn |
| State | Change `startDate` from string to Date object |
| DB insert | Wrap with `formatDateString()` for storage |
| UI | Replace native date input with Calendar Popover picker |


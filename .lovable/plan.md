

## Redesign the Events Box in Today's Agenda

### Problem
The right "Events" box currently lists individual event titles which looks cluttered, and has no action button like the other two boxes. It's inconsistent with the clean layout of the Calendar and Tasks boxes.

### Solution
**File: `src/components/dashboard/TasksDueTodayBanner.tsx`**

Redesign the events box to match the same clean pattern as the other two boxes:
- Show a summary count (e.g. "4 events") instead of listing individual event titles
- Add a "View Events" button at the bottom that navigates to the calendar's weekly view for today
- Remove the individual event title listing and the "+X more" text

### Changes

Replace the right box content (lines 204-225) with:

```tsx
{/* Right Box - Events */}
<div className="bg-muted/30 rounded-lg p-3 border border-border/30 flex flex-col items-center justify-between text-center min-h-[120px]">
  <Calendar className="h-8 w-8 text-primary mb-2" />
  <div className="space-y-1">
    {todayEvents.length > 0 ? (
      <p className="text-sm text-foreground font-medium">
        {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}
      </p>
    ) : (
      <p className="text-sm text-muted-foreground">No events today</p>
    )}
  </div>
  <div className="mt-auto w-full">
    <Button
      onClick={() => navigate('/calendar?view=weekly')}
      variant="outline"
      size="sm"
      className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary w-full"
    >
      View Events
    </Button>
  </div>
</div>
```

This makes all three boxes visually consistent: icon at top, summary text in the middle, action button at the bottom. The "View Events" button navigates to the calendar weekly view so the user can see all of today's events in detail.


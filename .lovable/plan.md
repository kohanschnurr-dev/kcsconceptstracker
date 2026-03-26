

## Plan: Add Click-to-Create Event on Project Calendar

### What
Allow clicking on any date cell in the Project Schedule calendar to open the "New Event" modal with that date pre-filled — same pattern already used in the main Calendar page's MonthlyView.

### Changes

**File: `src/components/project/ProjectCalendar.tsx`**

1. Add state for the quick-create modal:
   ```typescript
   const [quickCreateOpen, setQuickCreateOpen] = useState(false);
   const [quickCreateDate, setQuickCreateDate] = useState<Date | undefined>();
   ```

2. Add an `onClick` handler to each day cell `<div>` (the outer container, not the date number button) that sets the date and opens the modal:
   ```typescript
   onClick={() => {
     setQuickCreateDate(day);
     setTimeout(() => setQuickCreateOpen(true), 0);
   }}
   ```
   Also add `cursor-pointer` to the day cell styling.

3. Add a second `<NewEventModal>` instance at the bottom (before `</Card>`) controlled externally — same pattern as the main Calendar page:
   ```tsx
   <NewEventModal
     projects={[{ id: projectId, name: projectName, address: projectAddress }]}
     onEventCreated={fetchEvents}
     defaultProjectId={projectId}
     externalOpen={quickCreateOpen}
     onExternalOpenChange={setQuickCreateOpen}
     defaultStartDate={quickCreateDate}
   />
   ```

### Files touched
- `src/components/project/ProjectCalendar.tsx` (~10 lines added)


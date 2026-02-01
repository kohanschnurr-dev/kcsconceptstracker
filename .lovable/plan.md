

## Plan: Align Month Navigation with Project Schedule Title

### Overview

Move the month navigation controls (< February 2026 >) to be inline with the "Project Schedule" title, creating a single-row header layout instead of the current stacked layout.

### Current Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📅 Project Schedule                              [+ Add Project Event]│
├─────────────────────────────────────────────────────────────────────┤
│ < February 2026 >                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ Legend...                                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### New Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📅 Project Schedule    < February 2026 >         [+ Add Project Event]│
├─────────────────────────────────────────────────────────────────────┤
│ Legend...                                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/components/project/ProjectCalendar.tsx`**

| Lines | Change |
|-------|--------|
| 118-149 | Restructure CardHeader to put title, month nav, and button on same row |

**Code Changes:**

Modify the CardHeader content to use a single flex row with three sections:

```typescript
<CardHeader className="pb-2">
  <div className="flex items-center justify-between">
    {/* Left: Title */}
    <CardTitle className="flex items-center gap-2 text-white">
      <CalendarIcon className="h-5 w-5 text-emerald-500" />
      Project Schedule
    </CardTitle>
    
    {/* Center: Month Navigation */}
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-white min-w-[120px] text-center">
        {format(currentDate, 'MMMM yyyy')}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
    
    {/* Right: Add Event Button */}
    <NewEventModal
      projects={[{ id: projectId, name: projectName, address: projectAddress }]}
      onEventCreated={fetchEvents}
      defaultProjectId={projectId}
    />
  </div>
  <CalendarLegend />
</CardHeader>
```

---

### Result

The header will now display:
- **Left**: Calendar icon + "Project Schedule" title
- **Center**: Month navigation arrows with month/year label
- **Right**: "+ Add Project Event" button

All aligned on a single row for a cleaner, more compact header.


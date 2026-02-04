

## Plan: Restructure Tasks Due Today Banner into Two-Box Layout

### Overview
Transform the current single-row TasksDueTodayBanner into a two-box grid layout, removing the task badges on the right side and creating a cleaner, more balanced visual design.

---

### Current Layout
```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [Icon] Today  2 Items                    [Electrical...] [Painting] [Calendar btn] │
│        📅 2 events today                                                            │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### New Layout
```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ [Icon] Today's Agenda                                         [View Calendar →]   │
├─────────────────────────────────┬──────────────────────────────────────────────────┤
│  Tasks                          │  Events                                          │
│  ┌───────────────────────────┐  │  ┌───────────────────────────────────────────┐   │
│  │ 2 tasks due today         │  │  │ Electrical for Condensor                  │   │
│  │ 1 overdue                 │  │  │ Painting                                  │   │
│  └───────────────────────────┘  │  └───────────────────────────────────────────┘   │
│  [View Tasks →]                 │                                                  │
└─────────────────────────────────┴──────────────────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/components/dashboard/TasksDueTodayBanner.tsx`**

1. **Replace single-row layout with two-box grid:**
   - Remove the horizontal flex layout with badges on the right
   - Add a `grid grid-cols-2 gap-3` container like CalendarGlanceWidget
   - Both boxes share same minimum height for balance

2. **Left Box - Tasks:**
   - Show tasks due today count
   - Show overdue count (if any, highlighted in destructive color)
   - "View Tasks" button at bottom

3. **Right Box - Events:**
   - Show today's calendar events as a list (up to 3)
   - "+X more" indicator if more than 3 events
   - Events styled with category colors

4. **Header changes:**
   - Keep icon + "Today's Agenda" title
   - Move "Calendar" button to header right side
   - Remove task/event badges from header area

---

### Component Structure

```tsx
<div className="glass-card p-4">
  {/* Header Row */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <ListChecks icon />
      <h3>Today's Agenda</h3>
      <Badge>{totalActionable} Items</Badge>
    </div>
    <Button>View Calendar</Button>
  </div>

  {/* Two-Box Grid */}
  <div className="grid grid-cols-2 gap-3">
    {/* Left Box - Tasks */}
    <div className="bg-muted/30 rounded-lg p-3 border min-h-[100px]">
      <Badge>Tasks</Badge>
      <div>
        {tasksDueToday.length} due today
        {overdueCount} overdue
      </div>
      <Button>View Tasks</Button>
    </div>

    {/* Right Box - Events */}
    <div className="bg-muted/30 rounded-lg p-3 border min-h-[100px]">
      <Badge>Events</Badge>
      {todayEvents.map(event => <EventRow />)}
    </div>
  </div>
</div>
```

---

### Visual Result

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ☑ Today's Agenda  [3 Items]                               [📅 View Calendar →]    │
├─────────────────────────────────┬──────────────────────────────────────────────────┤
│  TASKS                          │  EVENTS                                          │
│  ─────────────────────────────  │  ─────────────────────────────────────────────   │
│  📋 2 tasks due today           │  ┌─────────────────────────────────────────────┐ │
│  ⚠️ 1 overdue                   │  │ Electrical for Condensor                   │ │
│                                 │  └─────────────────────────────────────────────┘ │
│                                 │  ┌─────────────────────────────────────────────┐ │
│  [View Tasks →]                 │  │ Painting                                    │ │
│                                 │  └─────────────────────────────────────────────┘ │
└─────────────────────────────────┴──────────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/TasksDueTodayBanner.tsx` | Restructure from single row to two-box grid layout |

---

### Key Styling Details
- Match CalendarGlanceWidget styling: `bg-muted/30`, `border-border/30`, `min-h-[100px]`
- Tasks box shows counts with appropriate colors (warning for due, destructive for overdue)
- Events box lists actual event titles with category color coding
- Both boxes equal height for visual balance
- Maintains responsive behavior (banner already hidden on smaller screens via parent)


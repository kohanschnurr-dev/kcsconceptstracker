
## Plan: Simplify Dashboard Sidebar Layout

### Overview
Remove the UrgentTasksWidget from the dashboard right sidebar and reorganize the CalendarGlanceWidget into a split two-box layout within the same height.

---

### Current Layout
```text
┌─────────────────────────────────────────────────────────┐
│  Main Content (flex-1)              │  Sidebar (w-72)   │
│                                     │                   │
│  - Quick Task Input                 │  ┌─────────────┐  │
│  - Stats Grid                       │  │ Calendar    │  │
│  - Active Projects                  │  │ Glance      │  │
│  - Charts                           │  └─────────────┘  │
│                                     │  ┌─────────────┐  │
│                                     │  │ Urgent      │  │
│                                     │  │ Tasks       │  │
│                                     │  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### New Layout
```text
┌─────────────────────────────────────────────────────────┐
│  Main Content (flex-1)              │  Sidebar (w-72)   │
│                                     │                   │
│  - Quick Task Input                 │  ┌──────┬──────┐  │
│  - Stats Grid                       │  │Today │Week  │  │
│  - Active Projects                  │  │Events│Events│  │
│  - Charts                           │  └──────┴──────┘  │
│                                     │                   │
└─────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/pages/Index.tsx`**

1. **Remove UrgentTasksWidget import:**
   - Remove: `import { UrgentTasksWidget } from '@/components/dashboard/UrgentTasksWidget';`

2. **Update sidebar section (lines 317-323):**
   - Remove `<UrgentTasksWidget>` component
   - Keep only `<CalendarGlanceWidget>`

**File: `src/components/dashboard/CalendarGlanceWidget.tsx`**

3. **Restructure into two-box grid layout:**
   - Replace single column layout with a 2-column grid
   - Left box: "Today" section (today's events)
   - Right box: "This Week" section (upcoming week events)
   - Both boxes share same height, creating balanced visual

4. **Updated component structure:**
   ```tsx
   <div className="glass-card p-4">
     <div className="grid grid-cols-2 gap-3">
       {/* Left Box - Today */}
       <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
         <Badge>Today</Badge>
         {/* Today's events list */}
       </div>
       
       {/* Right Box - This Week */}
       <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
         <Badge>This Week</Badge>
         {/* Week's events list */}
       </div>
     </div>
   </div>
   ```

5. **Show empty state in each box** when no events for that section (instead of hiding entire widget)

---

### Visual Result

**New Calendar Glance Widget:**
```text
┌────────────────────────────────────────────────────────┐
│  Week at a Glance                    [View Calendar →] │
├──────────────────────────┬─────────────────────────────┤
│  Today                   │  This Week                  │
│  Tuesday, Feb 4          │                             │
│                          │                             │
│  ┌──────────────────┐    │  ┌──────────────────────┐   │
│  │ 🕐 Electrical    │    │  │ Flooring - Wed      │   │
│  └──────────────────┘    │  └──────────────────────┘   │
│  ┌──────────────────┐    │  ┌──────────────────────┐   │
│  │ 🕐 Painting      │    │  │ Final Walk - Fri    │   │
│  └──────────────────┘    │  └──────────────────────┘   │
└──────────────────────────┴─────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Remove UrgentTasksWidget import and usage |
| `src/components/dashboard/CalendarGlanceWidget.tsx` | Restructure into 2-column grid with Today/Week boxes |

---

### Expected Result
- Sidebar shows only the CalendarGlanceWidget
- Widget is divided into two equal boxes: "Today" (left) and "This Week" (right)
- Both boxes maintain same height for balanced appearance
- Cleaner dashboard with less visual clutter

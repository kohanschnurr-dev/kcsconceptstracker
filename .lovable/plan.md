

## Make Calendar Theme-Aware

### Problem
The calendar page uses hardcoded dark-mode colors (`bg-slate-900`, `text-white`, `bg-emerald-600`, etc.) instead of theme CSS variables. On light themes (Ivory, Pearl, Linen), this creates unreadable white-on-white text and jarring dark boxes on light backgrounds.

### Approach
Minimal, targeted class swaps -- replace hardcoded Tailwind color classes with their theme-variable equivalents. Category colors (the colored event pills) stay as-is since they're intentionally distinct.

### Color Mapping
```text
bg-slate-900        -> bg-background
bg-slate-800(/50)   -> bg-card(/50)
border-slate-700/800 -> border-border
text-white          -> text-foreground
text-slate-400/500  -> text-muted-foreground
text-slate-600      -> text-muted-foreground/60
bg-emerald-600      -> bg-primary
hover:bg-emerald-700 -> hover:bg-primary/90
text-emerald-400/500 -> text-primary
ring-emerald-500/50 -> ring-primary/50
hover:bg-slate-700  -> hover:bg-secondary
bg-slate-900/50     -> bg-background/50
bg-emerald-500/5    -> bg-primary/5
```

### Files to Update (7 files)

**1. `src/pages/Calendar.tsx`**
- Container backgrounds: `bg-slate-900` to `bg-background`, `border-slate-800` to `border-border`
- Empty state text: `text-slate-400/500` to `text-muted-foreground`

**2. `src/components/calendar/CalendarHeader.tsx`**
- Header bar: `bg-slate-900` to `bg-card`, `border-slate-800` to `border-border`
- Title/date text: `text-white` to `text-foreground`
- Icon: `text-emerald-500` to `text-primary`
- Nav buttons: `text-slate-400` to `text-muted-foreground`, `hover:bg-slate-700` to `hover:bg-secondary`
- View toggle container: `bg-slate-800` to `bg-secondary`
- Active view button: `bg-emerald-600` to `bg-primary`, `hover:bg-emerald-700` to `hover:bg-primary/90`
- Inactive view button: `text-slate-400` to `text-muted-foreground`, `hover:bg-slate-700` to `hover:bg-secondary`
- Autocomplete trigger: `bg-slate-800 border-slate-700 text-white` to `bg-card border-border text-foreground`

**3. `src/components/calendar/MonthlyView.tsx`**
- Day headers: `text-slate-500` to `text-muted-foreground`
- Day cells: `bg-slate-800/50 border-slate-700` to `bg-card/50 border-border`, `bg-slate-900/50 border-slate-800` to `bg-background/50 border-border/50`
- Today ring: `ring-emerald-500/50` to `ring-primary/50`
- Today text: `text-emerald-400` to `text-primary`
- Day numbers: `text-white` to `text-foreground`, `text-slate-600` to `text-muted-foreground/60`
- Overflow text: `text-slate-500` to `text-muted-foreground`

**4. `src/components/calendar/WeeklyView.tsx`**
- Day cells: `bg-slate-800/50 border-slate-700` to `bg-card/50 border-border`
- Today ring: `ring-emerald-500/50` to `ring-primary/50`
- Day headers: `border-slate-700` to `border-border`, `text-slate-500` to `text-muted-foreground`
- Day number: `text-white` to `text-foreground`, `text-emerald-400` to `text-primary`
- Empty state: `text-slate-600` to `text-muted-foreground/60`

**5. `src/components/calendar/GanttView.tsx`**
- Header border: `border-slate-700` to `border-border`
- Column headers: `text-slate-400/500` to `text-muted-foreground`, `text-emerald-400` to `text-primary`
- Project names: `text-white` to `text-foreground`
- Task labels: `text-slate-300` to `text-muted-foreground`
- Grid lines: `border-slate-800/50` to `border-border/50`
- Today column: `bg-emerald-500/5` to `bg-primary/5`
- Tooltips: `bg-slate-800 border-slate-700` to `bg-card border-border`, `text-white` to `text-foreground`, `text-slate-400` to `text-muted-foreground`
- Project row borders: `border-slate-800` to `border-border`, `bg-slate-800` to `bg-border`

**6. `src/components/calendar/DealCard.tsx`**
- Hover ring: `hover:ring-emerald-500/50` to `hover:ring-primary/50`
- Non-critical card bg: `bg-slate-800/50 border-slate-700` to `bg-card/50 border-border`
- Task title: `text-white` to `text-foreground`
- Project name/task count: `text-slate-400/500` to `text-muted-foreground`

**7. `src/components/calendar/WeatherWidget.tsx`**
- Widget container/loading: `bg-slate-800` to `bg-card`
- Label text: `text-slate-500` to `text-muted-foreground`
- Hover: `hover:bg-slate-700` to `hover:bg-secondary`
- Temp text: `text-white` to `text-foreground`
- Day label: `text-slate-500` to `text-muted-foreground`
- Tooltip: `bg-slate-800 border-slate-700` to `bg-card border-border`, `text-white` to `text-foreground`, `text-slate-400` to `text-muted-foreground`

**8. `src/components/calendar/CalendarLegend.tsx`**
- Legend label: `text-slate-400` to `text-muted-foreground`
- Critical path divider: `border-slate-700` to `border-border`

### What Stays Unchanged
- Category pill colors (teal, amber, purple, etc.) -- these are intentionally distinct per category group
- Budget health indicators (emerald/amber/red dots) -- semantic status colors
- Critical path red styling -- important visual alert
- Weather icon colors (amber, blue) -- semantic meaning

### Result
All 10 palettes (dark and light) will produce a readable, cohesive calendar. The category event pills remain colorful and distinguishable regardless of theme.

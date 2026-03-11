

## Plan: Replace Emojis with Lucide Vector Icons in Gantt Bars

Replace all emoji characters in the Gantt bar content and sidebar labels with Lucide React vector icons for a cleaner, consistent look.

### Changes

**`src/components/calendar/GanttView.tsx`**

1. Replace `getCategoryEmoji` with `getCategoryIcon` that returns Lucide icon components:
   - `plumbing_rough` → `Wrench`
   - `electrical_rough` → `Zap`
   - `hvac_rough` → `Snowflake`
   - `framing`, `demo` → `Hammer`
   - `painting`, `exterior_paint` → `Paintbrush`
   - `flooring` → `Layers`
   - `tile`, `countertops` → `Grid3x3`
   - `cabinetry` → `Square`
   - `windows` → `DoorOpen`
   - `drywall` → `PaintBucket`
   - `roofing`, `siding`, `open_house` → `Home`
   - `foundation_piers` → `Landmark`
   - `grading` → `TreePine`
   - `garage` → `Warehouse`
   - `stage_clean` → `Sparkles`
   - `listing_date`, `sale_closing`, `closing` → `CalendarDays`
   - `purchase`, `refinancing` → `DollarSign`
   - `order`, `item_arrived` → `Package`
   - inspections → `CheckCircle`
   - `permitting` → `ClipboardList`
   - `due_diligence`, `underwriting` → `FileText`
   - Group fallbacks follow same pattern
   - Default → `Wrench`

2. Import all needed icons from `lucide-react`.

3. Update both the **bar content** and **sidebar label** to render the Lucide icon component (size 12, `text-white` in bar, `text-muted-foreground` in sidebar) instead of emoji strings.


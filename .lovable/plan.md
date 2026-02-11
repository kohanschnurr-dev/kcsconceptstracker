
## Smart Icon Logic for Calendar Categories

Currently, every calendar category gets its icon based solely on its **group** (e.g., all "Interior Finishes" items get the PaintBucket icon). This means custom items like "Flooring" show a paint bucket, which is misleading.

### The Fix

Update `DealCard.tsx` to use a two-tier icon lookup:

1. **First**, check the category value/label against a keyword map that matches common construction terms to appropriate icons
2. **Only if no keyword matches**, fall back to the current group-based default icon

### Keyword-to-Icon Map

| Keywords | Icon | Rationale |
|----------|------|-----------|
| floor, lvp, hardwood, carpet | Layers (stacked layers) | Flooring materials |
| plumb, drain, pipe, water_heater | Droplets | Water/plumbing work |
| electric, wiring | Zap | Electrical |
| hvac, ac, heat, furnace | Fan | HVAC systems |
| paint, stain | PaintBucket | Painting |
| demo, demolition | Hammer | Demolition |
| frame, framing, carpentry, trim | Hammer | Structural wood |
| roof | Home | Roofing |
| tile | Grid2x2 | Tile work |
| cabinet, counter | Square | Cabinetry |
| window, door, glass | DoorOpen | Openings |
| inspect, permit, code | ClipboardCheck | Inspections |
| clean, stage | Sparkles | Cleaning/staging |
| fence, gate | Fence | Fencing |
| landscape, yard, sod | Trees | Landscaping |
| foundation, pier, concrete | Landmark | Foundation |
| insulation | ShieldCheck | Insulation |
| drywall, sheetrock | PaintBucket | Drywall (still relevant) |
| garage | Warehouse | Garage |
| siding, stucco, brick, exterior | Home | Exterior |
| list, open_house, closing, sale | Calendar | Milestones |
| purchase, refinanc | Calendar | Financial milestones |
| order, arrived, delivery | Package | Procurement |

### Technical Details

**File: `src/components/calendar/DealCard.tsx`**

- Add additional icon imports: `Layers, Grid2x2, DoorOpen, Trees, Landmark, ShieldCheck, Warehouse, Package, Fence, Square`
- Create a `KEYWORD_ICON_MAP` array of `{ keywords: string[], icon: IconComponent }` entries
- Refactor `getCategoryIcon` to:
  1. Normalize the category value to lowercase
  2. Loop through the keyword map; if any keyword is a substring of the category value, return that icon
  3. If no match, fall back to the existing group-based switch

This approach means any custom category a user adds (like "flooring", "tile_work", "plumbing_fixtures") will automatically get a sensible icon without any configuration needed.

**No other files need changes.** The icon logic is entirely contained in `DealCard.tsx`.

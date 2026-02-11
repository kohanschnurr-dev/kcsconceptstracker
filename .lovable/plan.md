

## Fix Hardcoded Colors for Theme Readability

Four files still use hardcoded `bg-slate-*`, `text-white`, `text-slate-*`, and `bg-emerald-*` classes that break on light themes. The screenshot shows the Category Breakdown popout with dark text on a light background becoming unreadable.

### Files to Update

**1. `src/components/ops/CategoriesPopout.tsx`**
- Line 103: `itemStyle={{ color: '#FFFFFF' }}` -> `color: 'hsl(var(--foreground))'`
- Line 104: `labelStyle={{ color: '#FFFFFF' }}` -> `color: 'hsl(var(--foreground))'`
- Line 123: `text-white` -> `text-foreground`
- Line 126: `text-white` -> `text-foreground`

**2. `src/components/calendar/NewEventModal.tsx`** (full sweep)
- Line 181: `bg-emerald-600 hover:bg-emerald-700` -> `bg-primary hover:bg-primary/90`
- Line 186: `bg-slate-900 border-slate-700` -> `bg-background border-border`
- Line 188: `text-white` -> `text-foreground`
- Line 194: `text-slate-300` -> `text-muted-foreground`
- Line 200: `bg-slate-800 border-slate-700 text-white hover:bg-slate-700` -> `bg-card border-border text-foreground hover:bg-secondary`
- Line 206: `text-slate-300` -> `text-muted-foreground`
- Line 214: `bg-slate-800 border-slate-700 text-white hover:bg-slate-700` -> `bg-card border-border text-foreground hover:bg-secondary`
- Line 233: `bg-slate-800 border-slate-700` (PopoverContent) -> `bg-card border-border`
- Line 234: `bg-slate-800` (Command) -> `bg-card`
- Line 239: `text-white` -> `text-foreground`
- Line 243: `text-slate-400` -> `text-muted-foreground`
- Line 264: `text-white cursor-pointer aria-selected:bg-slate-700` -> `text-foreground cursor-pointer aria-selected:bg-secondary`
- Line 295: `text-slate-300` -> `text-muted-foreground`
- Line 301: `bg-slate-800 border-slate-700 text-white` -> `bg-card border-border text-foreground`
- Line 314: `border-slate-700` -> `border-border`
- Line 317: `text-slate-500` -> `text-muted-foreground`
- Line 330: `text-slate-300` -> `text-muted-foreground`
- Line 342: `border-slate-500 data-[state=checked]:bg-slate-600` -> `border-muted-foreground data-[state=checked]:bg-muted-foreground`
- Line 345-346: `text-slate-400` -> `text-muted-foreground`
- Line 357: `text-slate-400` -> `text-muted-foreground`
- Lines 363, 388, 413, 454: `bg-slate-800 border-slate-700` -> `bg-card border-border`
- Lines 370, 395, 420, 461: PopoverContent `bg-slate-800 border-slate-700` -> `bg-card border-border`
- Line 435: `text-slate-300` -> `text-muted-foreground`
- Line 442: `bg-slate-800 border-slate-700 text-white` -> `bg-card border-border text-foreground`
- Line 444: `text-slate-500` -> `text-muted-foreground`
- Line 448: `text-slate-300` -> `text-muted-foreground`
- Line 474: `bg-slate-800/50 border border-slate-700` -> `bg-card/50 border border-border`
- Line 484: `text-slate-200` -> `text-foreground`
- Line 489: `text-slate-500` -> `text-muted-foreground`
- Line 497: `text-slate-300` -> `text-muted-foreground`
- Line 502: `bg-slate-800 border-slate-700 text-white` -> `bg-card border-border text-foreground`
- Line 512: `border-slate-700 text-slate-300` -> `border-border text-muted-foreground`
- Line 519: `bg-emerald-600 hover:bg-emerald-700` -> `bg-primary hover:bg-primary/90`

**3. `src/components/calendar/TaskDetailPanel.tsx`** (full sweep)
- Line 297: `bg-slate-900 border-slate-800` -> `bg-background border-border`
- Line 298: `border-slate-800` -> `border-border`
- Line 305: `hover:border-slate-700 focus:border-emerald-500 text-white` -> `hover:border-border focus:border-primary text-foreground`
- Line 308: `text-slate-400` -> `text-muted-foreground`
- Line 316: `text-slate-400` -> `text-muted-foreground`
- Line 321: `bg-slate-900 border-slate-700` -> `bg-background border-border`
- Line 323: `text-white` -> `text-foreground`
- Line 324: `text-slate-400` -> `text-muted-foreground`
- Line 329: `bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700` -> `bg-card border-border text-muted-foreground hover:bg-secondary`
- Line 335: `text-white` stays (on red button -- acceptable for contrast)
- Line 348: `text-slate-400` -> `text-muted-foreground`
- Line 351: `bg-slate-800 border-slate-700 text-white` -> `bg-card border-border text-foreground`
- Line 356: `bg-slate-800 border-slate-700` -> `bg-card border-border`
- Line 369: `text-white cursor-pointer focus:bg-slate-700` -> `text-foreground cursor-pointer focus:bg-secondary`
- Line 382: `text-slate-400` -> `text-muted-foreground`
- Line 388: `bg-slate-800 border-slate-700 text-white hover:bg-slate-700` -> `bg-card border-border text-foreground hover:bg-secondary`
- Line 390: `text-slate-400` -> `text-muted-foreground`
- Line 394: `bg-slate-800 border-slate-700` -> `bg-card border-border`
- Line 403: `text-slate-500` -> `text-muted-foreground`
- Line 408: same as 388
- Line 410: same as 390
- Line 414: same as 394
- Line 427: `bg-slate-800/50` -> `bg-card/50`
- Line 463: `text-slate-300` -> `text-muted-foreground`
- Line 464: `text-slate-500` -> `text-muted-foreground`
- Line 477: `bg-slate-800 border-slate-700 text-white` -> `bg-card border-border text-foreground`
- Line 484: `border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500` -> `border-border text-muted-foreground hover:text-primary hover:border-primary`
- Line 497: `bg-slate-800/50` -> `bg-card/50`
- Line 507: `text-slate-500 hover:text-emerald-500` -> `text-muted-foreground hover:text-primary`
- Line 512: `text-white` -> `text-foreground`, `text-slate-500` -> `text-muted-foreground`
- Line 518: `text-slate-500` -> `text-muted-foreground`
- Line 525: `text-slate-500` -> `text-muted-foreground`
- Line 534: `text-slate-300` -> `text-muted-foreground`
- Line 546: `border-slate-700 text-slate-400 hover:text-white hover:border-slate-600` -> `border-border text-muted-foreground hover:text-foreground hover:border-border`
- Line 557: `bg-slate-800` -> `bg-card`
- Line 560: `text-slate-400` -> `text-muted-foreground`
- Line 561: `text-white` -> `text-foreground`
- Line 564: `text-slate-500` -> `text-muted-foreground`
- Line 572: `text-slate-400` -> `text-muted-foreground`
- Line 584: `text-slate-300` -> `text-muted-foreground`
- Line 589: `bg-slate-800 border-slate-700 text-white placeholder:text-slate-500` -> `bg-card border-border text-foreground placeholder:text-muted-foreground`
- Line 596: `text-slate-300` -> `text-muted-foreground`
- Line 599: `text-slate-500` -> `text-muted-foreground`
- Line 606: `bg-slate-800` -> `bg-card`, `text-slate-300` -> `text-muted-foreground`
- Line 617: `bg-slate-900 border-t border-slate-800` -> `bg-background border-t border-border`
- Line 621: `bg-emerald-600 hover:bg-emerald-700 text-white` -> `bg-primary hover:bg-primary/90 text-primary-foreground`

**4. `src/components/project/ProjectCalendar.tsx`** (full sweep)
- Line 116: `bg-slate-900 border-slate-800` -> `bg-background border-border`
- Line 120: `text-white` -> `text-foreground`
- Line 121: `text-emerald-500` -> `text-primary`
- Line 131: `text-slate-400 hover:text-white hover:bg-slate-800` -> `text-muted-foreground hover:text-foreground hover:bg-secondary`
- Line 135: `text-white` -> `text-foreground`
- Line 142: same as 131
- Line 161: `text-slate-500` -> `text-muted-foreground`
- Line 183: `bg-slate-800/50 border-slate-700` -> `bg-card/50 border-border`
- Line 184: `bg-slate-900/50 border-slate-800` -> `bg-background/50 border-border/50`
- Line 185: `ring-emerald-500/50` -> `ring-primary/50`
- Line 198: `text-emerald-400` -> `text-primary`
- Line 200: `text-white` -> `text-foreground`
- Line 201: `text-slate-600` -> `text-muted-foreground/60`
- Line 202: `hover:bg-slate-700` -> `hover:bg-secondary`
- Line 225: `text-slate-500 hover:text-slate-300` -> `text-muted-foreground hover:text-foreground`
- Line 237: `text-slate-500` -> `text-muted-foreground`

### What Stays Unchanged
- Semantic status colors (emerald/amber/red for budget health, goal progress, rule completion) -- these have intentional meaning
- Category pill colors -- intentionally distinct
- Critical path red styling
- `text-white` on the red delete button (contrast requirement)

### Result
All four remaining files will use theme CSS variables, making every calendar and ops modal readable across all 10 palettes.


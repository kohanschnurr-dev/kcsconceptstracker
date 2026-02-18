
## Fix Dashboard Mobile Overflow

### Problems Identified

From the screenshot, two components on the dashboard are overflowing on mobile:

**1. Today's Agenda — 3-column button text overflow**
The three equal-column grid boxes each have full button labels like "View Calendar", "2 Tasks Overdue", "View Events". On a ~375px screen, with 3 equal columns and internal padding, each column is only ~100px wide — not enough for those button labels, causing text overflow or clipping.

**2. Quick Task Input — row is too wide**
The input row has: `[+ Quick add task... (press Enter to save)] [📅 icon] [Add button]`
The placeholder text is very long and pushes the calendar icon + Add button off-screen. The screenshot shows "Quick add tas" cut off, with the calendar and Add button barely fitting.

### Solution

#### Fix 1: Today's Agenda (`src/components/dashboard/TasksDueTodayBanner.tsx`)

Reduce button text length on mobile. On small screens, use shorter labels:
- "View Calendar" → "Calendar" (or icon-only label)
- "2 Tasks Overdue" → "2 Overdue"
- "View Events" → "Events" (or count)

Apply this using responsive text via a `<span className="hidden sm:inline">` pattern, or simply shorten the labels unconditionally since the longer text fits fine on tablet/desktop where more space is available. Alternatively, reduce box padding from `p-3` to `p-2` and use `text-xs` buttons on mobile.

Best approach: add `text-xs` to the button on mobile and use shorter label strings that fit in ~100px:
- Button: `size="sm"` → add `className="... text-xs sm:text-sm"`
- Reduce padding in the box from `p-3` to `p-2 sm:p-3`
- Shorten labels to: "Calendar", "N Overdue" / "Tasks", "Events"

#### Fix 2: Quick Task Input (`src/components/dashboard/QuickTaskInput.tsx`)

The placeholder text is too long. Shorten it to just "Quick add task..." (dropping " (press Enter to save)") — the form already handles Enter submission and the hint isn't critical.

Additionally, on mobile the layout can be tightened:
- The Add button has `min-w-[80px] px-5` — reduce to `min-w-[60px] px-3 sm:px-5 sm:min-w-[80px]`
- The calendar trigger has `min-w-[44px] px-4` — reduce to `px-2 sm:px-4`

### Files to Modify

| File | Change |
|---|---|
| `src/components/dashboard/TasksDueTodayBanner.tsx` | Shorten button text labels for mobile; reduce box padding on mobile; make buttons `text-xs` on mobile |
| `src/components/dashboard/QuickTaskInput.tsx` | Shorten placeholder text; reduce button padding on mobile |

### Technical Details

**TasksDueTodayBanner.tsx** — button label changes:

```tsx
// Left box: "View Calendar" → "Calendar" on mobile
<Button size="sm" className="... w-full text-xs sm:text-sm">
  <span className="sm:hidden">Calendar</span>
  <span className="hidden sm:inline">View Calendar</span>
</Button>

// Middle box: "2 Tasks Overdue" → "2 Overdue" on mobile
{overdueCount > 0
  ? <><span className="sm:hidden">{overdueCount} Overdue</span><span className="hidden sm:inline">{overdueCount} Tasks Overdue</span></>
  : ...
}

// Right box: similar treatment for "View Events"

// Reduce box padding:
<div className="bg-muted/30 rounded-lg p-2 sm:p-3 border ...">
```

**QuickTaskInput.tsx** — compact on mobile:

```tsx
// Shorter placeholder
placeholder="Quick add task..."

// Compact calendar button
className={cn("shrink-0 gap-1 min-w-[44px] px-2 sm:px-4", ...)}

// Compact Add button  
className="min-w-[60px] px-3 sm:min-w-[80px] sm:px-5"
```

### Visual Result

**Before (mobile):**
```
[View Calendar] [2 Tasks Overdue] [View Events]  ← overflows
[+ Quick add tas...] [📅] [Add]                  ← clipped
```

**After (mobile):**
```
[Calendar] [2 Overdue] [Events]                  ← all visible
[+ Quick add task...] [📅] [Add]                 ← fits cleanly
```

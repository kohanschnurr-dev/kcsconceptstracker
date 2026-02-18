
## Fix Project Calendar for Mobile: Flawless UI

### Problems Identified (from screenshot)

The Project Schedule calendar inside `ProjectCalendar.tsx` has multiple mobile layout issues:

1. **Header row is too cramped** — "Project Schedule" title, month nav (chevrons + picker), and "+ Add" button all compete on one tight row at mobile width (~375px). Elements get squeezed.
2. **Legend is too tall** — The `CalendarLegend` wraps to 3 rows on mobile, consuming significant vertical space before the calendar even begins.
3. **Day column headers are too wide** — "Sun", "Mon", etc. (3 characters) in 7 equal columns on narrow screens look tight. Should abbreviate to 1 letter ("S", "M", "T"...) on mobile.
4. **Day cells are barely usable** — `min-h-[100px]` cells with `p-2` in 7 columns on a 375px screen = ~43px wide per cell. Event cards are unreadable.
5. **Event title truncation** — `DealCard` compact mode uses `truncate` class which cuts mid-character.
6. **No swipe to change months** — Users must tap tiny 32px chevron buttons. Should support swipe left/right to navigate months, same as the tabs fix done previously.

### Solution

**File: `src/components/project/ProjectCalendar.tsx`**

#### 1. Restructure the header into two rows on mobile

```
Row 1: [Calendar icon + "Project Schedule"]    [+ Add Event button]
Row 2 (centered): [<]  February 2026  [>]
```

This gives each element breathing room.

#### 2. Make legend collapsible / compact on mobile

Wrap the legend in a `details`-style toggle or show it as a 2-column grid with smaller text on mobile. The simplest fix: add `text-xs` and reduce the gap on mobile, keeping it in 2 columns using `grid-cols-2 sm:flex`.

#### 3. Abbreviate day headers on mobile

Replace `['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']` display with single letters on small screens using `hidden sm:inline` / `sm:hidden` on the full vs short labels.

#### 4. Reduce cell min-height and padding on mobile

Change `min-h-[100px] p-2` to `min-h-[60px] p-0.5 sm:p-2 sm:min-h-[100px]` so cells breathe at mobile width.

#### 5. Fix event card truncation mid-word

In `DealCard`'s compact mode (line 85, 95), change `truncate` → `line-clamp-1` on the title `<span>`.

#### 6. Add swipe to navigate months

Add `touchStartX` / `touchStartY` refs and `onTouchStart` / `onTouchEnd` handlers on the calendar grid wrapper. Swiping left advances to next month, right goes to previous month.

### Files to Modify

| File | Change |
|---|---|
| `src/components/project/ProjectCalendar.tsx` | Restructure header into 2 rows. Add month-swipe touch handlers. Abbreviate day headers on mobile. Reduce cell padding/min-height for mobile. |
| `src/components/calendar/DealCard.tsx` | Fix compact mode truncation: `truncate` → `line-clamp-1` on the title span. |
| `src/components/calendar/CalendarLegend.tsx` | Make legend responsive: 2-column grid on mobile instead of flex-wrap. |

### Visual Layout After Fix (mobile)

```text
┌─────────────────────────────────────┐
│ 📅 Project Schedule    [+ Add Event]│  ← Row 1: title left, button right
│         ◀  February 2026  ▶         │  ← Row 2: centered nav
│ ┌──────────────────────────────┐    │
│ │ Acq/Admin  🟦  Structural 🟪│    │  ← Legend: 2-col grid, compact
│ │ Rough-ins  🟧  Inspections 🟩│   │
│ │ Int Finish 🟫  Milestones 🟡│    │
│ └──────────────────────────────┘    │
│  S   M   T   W   T   F   S         │  ← Single-letter headers
│ ┌───┬───┬───┬───┬───┬───┬───┐      │
│ │   │   │ 3 │ 4 │ 5 │   │   │      │  ← Tighter cells, still readable
│ │   │   │[E]│[E]│   │   │   │      │
│ ├───┼───┼───┼───┼───┼───┼───┤      │
│ │ 8 │ 9 │10 │11 │12 │13 │14 │      │
│ │   │[E]│[E]│[E]│   │[E]│   │      │
└─────────────────────────────────────┘
```

Swiping left/right on the grid moves to next/previous month.

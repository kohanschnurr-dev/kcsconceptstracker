

## Redesign Today's Agenda: Equal Columns + Sleek Style

### File: `src/components/dashboard/TasksDueTodayBanner.tsx`

**1. Equal-width columns**
Change the grid from `grid-cols-[auto_1fr_1fr]` to `grid-cols-3` so all three boxes share the same width.

**2. Match the View Calendar box style**
- Make Tasks and Events boxes centered like the Calendar box (items centered, compact)
- Replace the full-width "View Tasks" button with a smaller outline button matching the "View Calendar" style
- Remove `min-h-[100px]` constraints -- let content dictate height naturally
- Center content vertically and horizontally in each box

**3. Layout per box (all three follow same pattern)**

```
+------------------+------------------+------------------+
|   Calendar icon  |   Clock icon     |   Calendar icon  |
|  View Calendar   |   2 overdue      |  No events today |
|                  |  View Tasks      |                  |
+------------------+------------------+------------------+
```

- Each box: centered flex column, same padding, same border style
- Tasks box: icon at top, status text below, small "View Tasks" outline button at bottom
- Events box: icon at top, event list or "No events today" text, centered

### Technical Changes

In `TasksDueTodayBanner.tsx`:
- Line with grid class: change `grid-cols-[auto_1fr_1fr]` to `grid-cols-3`
- Calendar box: remove `min-w-[120px]`, keep existing centered layout
- Tasks box: remove `min-h-[100px]`, add `items-center justify-center text-center`, shrink the button to match "View Calendar" style (outline variant, small size)
- Events box: remove `min-h-[100px]`, add `items-center justify-center text-center`
- Use consistent icon sizes (h-8 w-8) and spacing across all three boxes

No other files need to change.



## Plan: Increase Calendar Cell Height to Fill More Vertical Space

### Problem

The main Calendar page (at `/calendar`) has significant dead space below the calendar grid. The current cell height of `100px` leaves a lot of empty space, especially on larger screens.

### Solution

Increase the calendar day cell height from `100px` to `120px` in the MonthlyView component. This is a subtle 20% increase that will help fill more vertical space without being overwhelming.

---

### Technical Changes

**File: `src/components/calendar/MonthlyView.tsx`**

| Line | Current | New |
|------|---------|-----|
| 66 | `min-h-[100px]` | `min-h-[120px]` |

This single change will make the calendar grid taller, reducing the dead space below while keeping the same overall design and functionality.

---

### Visual Impact

```text
Before (100px cells):           After (120px cells):
+--+--+--+--+--+--+--+         +---+---+---+---+---+---+---+
|1 |2 |3 |4 |5 |6 |7 |         | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|  |██|██|  |  |  |  |         |   | ██| ██|   |   |   |   |
+--+--+--+--+--+--+--+         |   |   |   |   |   |   |   |
|8 |9 |10|11|12|13|14|         +---+---+---+---+---+---+---+
...                            | 8 | 9 | 10| 11| 12| 13| 14|
                               |   |   |   |   |   |   |   |
[lots of empty space]          +---+---+---+---+---+---+---+
                               ...
                               [Less dead space below]
```

---

### Files to Modify

| File | Action |
|------|--------|
| `src/components/calendar/MonthlyView.tsx` | Change `min-h-[100px]` to `min-h-[120px]` on line 66 |


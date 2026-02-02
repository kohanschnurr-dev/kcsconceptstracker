

## Plan: Make Calendar Fill More Vertical Space

### Problem

The Project Schedule calendar on the project detail page has small calendar cells (`min-h-[60px]`) which leaves significant dead space below the calendar grid, especially on larger screens.

---

### Solution

Increase the calendar cell heights to better utilize the available vertical space, making the calendar more prominent and easier to interact with.

---

### Changes to ProjectCalendar.tsx

**File: `src/components/project/ProjectCalendar.tsx`**

| Line | Current | New |
|------|---------|-----|
| 181 | `min-h-[60px]` | `min-h-[100px]` |

This matches the height used in the main Calendar page's MonthlyView component, providing visual consistency across the application.

**Additional improvements:**
- Increase cell padding from `p-1` to `p-2` for better spacing
- Increase day number size from `w-6 h-6` to `w-7 h-7` for better touch targets
- Show up to 3 events per cell instead of 2 before showing "+X more"

---

### Visual Result

```text
Before (60px cells):              After (100px cells):
+--+--+--+--+--+--+--+           +----+----+----+----+----+----+----+
|1 |2 |3 |4 |5 |6 |7 |           | 1  | 2  | 3  | 4  | 5  | 6  | 7  |
|  |██|  |  |  |  |  |           |    | ██ |    |    |    |    |    |
+--+--+--+--+--+--+--+           |    | ██ |    |    |    |    |    |
|8 |9 |10|..                     +----+----+----+----+----+----+----+
                                 | 8  | 9  | 10 |...
[lots of empty space]
                                 [Calendar fills more of the screen]
```

---

### Files to Modify

| File | Action |
|------|--------|
| `src/components/project/ProjectCalendar.tsx` | Increase cell height and improve spacing |


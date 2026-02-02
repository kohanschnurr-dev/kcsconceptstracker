

## Plan: Reorganize Budget Calculator for Better Space Efficiency

### Problem

The current Budget Calculator displays **39 individual category cards** across 6 groups, each with header spacing. This creates:
1. Excessive vertical scrolling to see all categories
2. Visual crowding with repetitive card layouts
3. Inefficient use of horizontal space
4. Group headers taking up valuable space

### Solution

Reorganize the layout using **collapsible category groups** and a **more compact card grid**, reducing the visual footprint while keeping all functionality accessible.

---

### Key Changes

**1. Collapsible Category Groups**
- Wrap each group (Structure, MEPs, Finishes, etc.) in a collapsible accordion
- Show a summary badge with the group's subtotal when collapsed
- Expand to show individual category inputs when needed
- Default: All groups collapsed OR only the first group expanded

**2. Compact Category Card Design**
- Reduce card padding from `p-3` to `p-2`
- Remove the vertical gap between icon row and input row
- Use a single-line layout: `[Icon] Label [$____]` in one row
- Increase grid density: 6 columns on xl screens instead of 5

**3. Integrate Total Budget into MAO Gauge**
- Remove the separate "Total Rehab Budget" summary card (currently 4 lines of vertical space)
- Move the total budget display into the MAO Gauge bar (already showing this data)

**4. Tighter Spacing**
- Reduce `space-y-8` between groups to `space-y-4`
- Reduce padding in the main scroll area from `p-6` to `p-4`

---

### Layout Before vs After

```text
BEFORE (requires scrolling):
+----------------------------------------+
| MAO Gauge                              |
+----------------------------------------+
| Total Budget Summary Card (4 lines)    |
+----------------------------------------+
| Structure Header                       |
| [card][card][card][card][card]        |
| [card]                                 |
+----------------------------------------+
| MEPs Header                            |
| [card][card][card][card][card]        |
+----------------------------------------+
| Finishes Header                        |
| [card][card][card][card][card]        |
| [card][card]                          |
+----------------------------------------+
| ... continues with more scrolling ...  |
+----------------------------------------+
```

```text
AFTER (compact, minimal scrolling):
+----------------------------------------+
| MAO Gauge (includes total budget)      |
+----------------------------------------+
| > Structure ($X)    > MEPs ($X)        |
| > Finishes ($X)     > Kitchen ($X)     |
| > Exterior ($X)     > Other ($X)       |
+----------------------------------------+
| [Expanded group shows compact cards]   |
| [Icon Label $___][Icon Label $___]     |
| [Icon Label $___][Icon Label $___]     |
+----------------------------------------+
| Profit Breakdown (collapsed)           |
+----------------------------------------+
```

---

### Technical Changes

**File: `src/components/budget/BudgetCanvas.tsx`**

| Change | Current | New |
|--------|---------|-----|
| Layout | Vertical list of groups | Collapsible accordions |
| Grid | 5 columns max | 6 columns max, tighter gap |
| Spacing | `space-y-8` | `space-y-4` |
| Add | — | Group subtotal badges |

**File: `src/components/budget/BudgetCategoryCard.tsx`**

| Change | Current | New |
|--------|---------|-----|
| Layout | 2-row (label, then input) | 1-row inline (icon + label + input) |
| Padding | `p-3` | `p-2` |
| Height | Variable | Compact fixed height |

**File: `src/pages/BudgetCalculator.tsx`**

| Change | Current | New |
|--------|---------|-----|
| Summary card | Separate card above canvas | Remove (data in MAO gauge) |
| Scroll padding | `p-6` | `p-4` |

---

### Accordion Behavior

- Clicking a group header expands it, showing its category cards
- Only one group can be expanded at a time (optional: allow multiple)
- Collapsed groups show: `[>] Structure ($12,500)` with the subtotal
- Expanded groups show: `[v] Structure ($12,500)` with cards below

---

### Files to Modify

| File | Action |
|------|--------|
| `src/components/budget/BudgetCanvas.tsx` | Add collapsible accordions with subtotals |
| `src/components/budget/BudgetCategoryCard.tsx` | Compact single-row layout |
| `src/pages/BudgetCalculator.tsx` | Remove summary card, tighten padding |

---

### Result

- **Reduced scrolling**: Collapsed groups fit on one screen
- **Better organization**: Users expand only the groups they're working on
- **Space efficient**: More categories visible per row
- **Clear totals**: Group subtotals visible at a glance
- **Same functionality**: All 39 categories remain accessible


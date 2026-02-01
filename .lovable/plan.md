

## Plan: Improve Calendar Header Alignment

### Overview

The Calendar header currently has inconsistent vertical alignment and spacing between elements. This plan will standardize heights, improve spacing consistency, and ensure all controls align properly in a single row.

---

### Current Issues (from screenshot)

1. **Inconsistent heights**: The Weather widget, view toggle group, project dropdown, and "Add Project Event" button have slightly different heights
2. **Spacing inconsistency**: Gap between elements varies
3. **Vertical alignment**: Elements don't align perfectly along the center line

---

### Technical Implementation

**File: `src/components/calendar/CalendarHeader.tsx`**

**1. Standardize button heights (h-9 throughout):**
- View toggle buttons: Change from `h-8` to `h-9`
- Navigation buttons: Keep at `h-8` (smaller is fine for icon-only)
- Project dropdown: Already `h-9` - good

**2. Adjust the toggle button container:**
- Add consistent padding and ensure the group container aligns with other elements

**3. Update the "Add Project Event" button in NewEventModal:**
- Ensure it has `h-9` height to match other controls

---

**File: `src/components/calendar/WeatherWidget.tsx`**

**4. Match weather widget height with other controls:**
- Adjust padding from `py-1.5` to `py-1` and ensure it aligns with `h-9` elements
- Ensure consistent `min-h-[36px]` (h-9 = 36px)

---

**File: `src/components/calendar/NewEventModal.tsx`**

**5. Standardize trigger button:**
- Add explicit `h-9` to the trigger button for consistency

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/calendar/CalendarHeader.tsx` | Standardize toggle button heights to h-9, improve container padding |
| `src/components/calendar/WeatherWidget.tsx` | Adjust padding/min-height to match h-9 standard |
| `src/components/calendar/NewEventModal.tsx` | Add h-9 to trigger button |

---

### Result

All header elements will:
- Have consistent 36px (h-9) heights
- Align perfectly along the vertical center
- Maintain uniform spacing between groups
- Look clean and professional


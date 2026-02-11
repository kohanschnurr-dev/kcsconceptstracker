

## Fix New Project Event Modal -- Eliminate Scroll

### Problem
The modal has `max-h-[90vh] overflow-y-auto` which causes a scrollbar. With all the fields (Project, Category, Title, Date, Recurring, Lead Time, Critical Path, Notes, Buttons), the content exceeds the viewport height.

### Solution
Use a **two-column layout** to spread the content horizontally and reduce vertical height, eliminating the need to scroll.

**File: `src/components/calendar/CalendarHeader.tsx`** -- no changes needed.

**File: `src/components/calendar/NewEventModal.tsx`**

1. **Widen the modal** from `max-w-lg` to `max-w-3xl` and remove `max-h-[90vh] overflow-y-auto`
2. **Split the form into two columns** using a `grid grid-cols-2 gap-6` layout:
   - **Left column**: Project, Category, Event Title, Date (with multi-day toggle)
   - **Right column**: Recurring Event section, Lead Time + Expected Date, Critical Path, Notes
3. **Move the Cancel/Create buttons** to span full width below both columns
4. **Reduce Notes textarea** height from `min-h-[80px]` to `min-h-[60px]` to save space

### Layout Preview

```text
+-----------------------------+------------------------------+
| Project *                   | Recurring event        [ON]  |
| [Search projects...]        |   Frequency: [Monthly v]     |
|                             |   Until: [Indef] [Date]      |
| Category *                  |   Will create up to 24...    |
| [Select category...]        |                              |
|                             | Lead Time    Expected Date   |
| Event Title *               | [0]          [Optional]      |
| [e.g., Foundation...]  [Z]  | e.g., City inspection delay  |
|                             |                              |
| Date *       [] Multi-day   | [x] Critical Path            |
| [Feb 10, 2026]              |     Highlight in red...      |
|                             |                              |
|                             | Notes                        |
|                             | [DFW-specific details...]    |
+-----------------------------+------------------------------+
|                          [Cancel]  [Create Event]           |
+-------------------------------------------------------------+
```

### Technical Details

- Line 237: Change `max-w-lg max-h-[90vh] overflow-y-auto` to `max-w-3xl`
- Line 242: Wrap the form fields (lines 243-637) in a `grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4` container
- Left column contains: Project, Category, Title, Date sections
- Right column contains: Recurring, Lead Time/Expected Date, Critical Path, Notes
- Submit buttons remain below the grid at full width


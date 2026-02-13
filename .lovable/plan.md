

## Fix: Align Buttons at Same Height Across All Boxes

### Problem
The "View Calendar" and "View Tasks" buttons sit at different vertical positions because `justify-center` pushes content to the middle. When the Tasks box has extra text (like "2 overdue"), its button drops lower than the Calendar box's button.

### Solution
**File: `src/components/dashboard/TasksDueTodayBanner.tsx`**

Change all three boxes from `justify-center` to `justify-between` so the icon stays at the top and the button/text anchors to the bottom. This way, regardless of whether there are overdue tasks or not, the buttons always sit at the same height.

Additionally:
- Always show the "View Tasks" button (even when there are no overdue/due-today tasks, show it with "No tasks due" text above)
- Use a `flex-1` spacer or `mt-auto` on the button to push it to the bottom consistently
- Keep `min-h-[120px]` so all boxes maintain the same fixed height

### Changes (single file)

**All three box containers**: Replace `justify-center` with `justify-between` so icon pins to top and button/content pins to bottom.

**Tasks box (middle)**: Always render the "View Tasks" button regardless of task counts, removing the conditional wrapper. This prevents the button from appearing/disappearing and shifting layout.

**Events box (right)**: Wrap bottom content with `mt-auto` so it aligns with the buttons in the other two boxes.


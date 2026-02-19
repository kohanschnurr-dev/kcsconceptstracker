

## Move Trash Icon Away from Close Button

The trash can icon is currently positioned to the right of the title, too close to the Sheet's X (close) button. Move it to the left side of the title row.

### Change

**`src/components/calendar/TaskDetailPanel.tsx`** (lines 326-356)

Restructure the header row so the trash button appears before the title instead of after it:

- Current order: `[Title + Project] [Trash]` (trash near X)
- New order: `[Trash] [Title + Project]` (trash on far left, away from X)

The trash button moves from after the title div to before it, giving clear separation from the Sheet's built-in close button in the top-right corner.

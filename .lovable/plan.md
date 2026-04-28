## Goal

On the Loans page filter row, move the three view controls — **Group**, **Table view**, **Card view** — to sit **in front of** the search bar (left side), and let the user mark their preferred starting view so the page opens that way every time.

## Layout change (left → right)

```text
[ Table | Cards ]  [ Group ★ ]   [ Search ............. ]   [ Status ▾ ]   [ Project ▾ ]
```

- The view-mode segmented control (Table / Cards icons) and the Group pill move to the **left edge** of the toolbar.
- The search input becomes the flexible middle element (still `flex-1`).
- Status and Project filter dropdowns stay on the right.
- `ml-auto` is removed from the toggle cluster since they’re now leading the row.

## Favorite / default view

Each of the three controls gets a small star affordance so the user can pin their preferred starting state:

- Long-press / right-click on a view toggle, OR a tiny star icon that appears on hover at the top-right corner of the active toggle — clicking the star sets that toggle as the default.
- Stored in `localStorage` under `loans:defaultView` with shape `{ viewMode: 'table' | 'cards', groupByProject: boolean }`.
- On page load, `useState` initializers read from localStorage; if missing, defaults stay `table` + `groupByProject: false`.
- The currently-favorited control shows a filled star; others show nothing until hover.
- A subtle toast confirms: "Default view saved" when set.

To keep the UI clean at 1812px and on mobile, the star sits as a 12px overlay in the top-right of the button, only visible on `hover` of the toggle group or when already favorited.

## Files to change

- `src/components/loans/LoanTable.tsx`
  - Reorder JSX in the toolbar (lines ~301–373): toggle cluster first, then search, then filters.
  - Add `localStorage` read in initial state for `viewMode` and `groupByProject`.
  - Add a `setAsDefault()` helper + small star button on each toggle.
  - Keep the existing "Group only visible in table mode" rule — when default is `cards`, the saved `groupByProject` is still remembered but only applied when the user switches back to table.

No other files need edits. No backend changes — preference is purely client-side per browser, matching the lightweight feel of a view toggle.

## Out of scope

- Syncing the default view across devices (would need a `user_preferences` table).
- Changing the actual table or card rendering.

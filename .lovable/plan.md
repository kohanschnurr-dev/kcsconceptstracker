## Fix: Top Gantt scrollbar not visible

The mirror scrollbar div is rendered, but it uses `overflow-x-auto` with only a 1px-tall inner spacer. WebKit may not paint the scrollbar reliably in that case, and the 14px height is shorter than the global 10px-thumb + 2px borders. It also lacks contrast against the page background.

### Changes (single file: `src/components/calendar/GanttView.tsx`)

1. Force the scrollbar to always render: change `overflow-x-auto` → `overflow-x-scroll` and add `overflow-y-hidden`.
2. Bump height from 14px → 18px so the themed thumb (10px + 2px border) has room.
3. Give the strip a visible track using `bg-secondary/30` and make it `sticky top-0 z-40` so it stays in view as the user scrolls the page vertically through long project lists (which was the original goal).
4. Keep the existing scroll-sync effect between `topScrollRef` and `scrollRef` — no logic changes.

No other files touched. No new dependencies.
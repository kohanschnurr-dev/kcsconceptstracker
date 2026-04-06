
Goal: remove the washed-out calendar colors and make every category read as a solid, dark, high-contrast color in light mode, especially Rough-ins and red categories.

1. Update the shared calendar palette in `src/lib/calendarCategories.ts`
- Replace the current soft/light-mode classes with darker, more solid values.
- Set `rough_ins` to a true dark yellow/amber palette, not pale orange:
  - darker swatch
  - darker header/text
  - stronger background and border
- Deepen `structural_exterior` to a dark red palette.
- Keep the other groups equally strong so nothing looks faded.
- Use solid light-mode classes instead of anything that reads like white opacity.

2. Fix the category dropdown rendering in `src/components/calendar/NewEventModal.tsx`
- Keep using the shared `swatchClass` dots.
- Make the group heading text and selected-category helper text explicitly use the darker palette so “Rough-ins” cannot appear muted.
- Add stronger class precedence if needed, because the command menu component applies muted heading styling by default.

3. Fix remaining faded red chips in `src/components/calendar/DealCard.tsx`
- Replace the still-faded critical-path styling with dark red text/background/border in light mode so those pills are readable everywhere.

4. Verify all other category UI that reuses the shared palette
- `src/components/calendar/TaskDetailPanel.tsx`
- `src/components/calendar/CalendarLegend.tsx`
- `src/components/settings/ManageSourcesCard.tsx`
Because these read from `CATEGORY_GROUPS`, the darker palette should propagate automatically. Only add local overrides if any shared component still forces muted colors.

5. QA pass
- Check the New Event modal list, selected category state, and calendar cards in light mode.
- Confirm:
  - “Rough-ins” is dark yellow/amber
  - red categories are dark red
  - dots, labels, and helper text are all easy to read
  - no pastel/faded appearance remains
  - dark mode still looks correct

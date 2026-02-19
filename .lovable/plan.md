
## Fix Calendar Dropdown Theme Styling

### The Problem

The calendar date-picker dropdowns ("February", "2026") and the "today" highlight are not properly following the active color palette. On iOS/mobile specifically, the native `<select>` dropdown options render with system-default light backgrounds regardless of the dark theme, because the CSS only targets the `<select>` element itself — not the `<option>` children.

The screenshot shows the Ivory palette (a light palette), where the dropdowns appear with minimal distinction from the background, and the "today" cell (19) has a muted brownish color that blends in. The styling needs to properly inherit from the active palette's CSS variables across all palettes and on mobile.

### Root Cause

The "calendar skipping mode" was added in `src/components/ui/calendar.tsx` via `captionLayout="dropdown-buttons"` with `fromYear`/`toYear`. The dropdown `<select>` element is styled with the `calendar-dropdown` CSS class, but:

1. The `.calendar-dropdown` rule in `src/index.css` (line 174) does NOT style `<option>` elements inside it
2. On iOS, native `<select>` pickers completely ignore CSS on options — the `color-scheme` property must be correctly inherited to get the right picker appearance
3. The CSS rule currently sets `color-scheme: inherit` but does not include an `<option>` fallback for desktop browsers

### Changes

**File 1: `src/index.css`** — Enhance the `.calendar-dropdown` CSS rules

- Add `option` styling inside `.calendar-dropdown` so desktop browsers render dropdown options with theme-appropriate background and text colors
- Ensure `color-scheme: inherit` is reliably set so iOS/mobile native pickers render in the correct light/dark mode
- Add explicit focus/hover states for the dropdown to use palette accent colors

The updated CSS block:

```css
.calendar-dropdown {
  max-height: 200px;
  overflow-y: auto;
  color-scheme: inherit;
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
}

.calendar-dropdown option {
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
}

.calendar-dropdown option:checked {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}
```

**File 2: `src/components/ui/calendar.tsx`** — Improve dropdown class styling

- Update the `dropdown` class to include stronger palette-aware styling: use `bg-secondary` as the resting background (instead of `bg-popover` which can be too similar to the card background on light palettes), and ensure `text-foreground` is explicit
- Ensure `day_today` uses a distinct but not overpowering style: keep `bg-accent text-accent-foreground` but add a ring to make it stand out from regular days without clashing with `day_selected`

Updated classNames:
- `dropdown`: Change from `bg-popover text-popover-foreground` to `bg-secondary text-foreground` for better contrast on both light and dark palettes, keep all other classes unchanged
- `day_today`: Add `ring-1 ring-primary/30` alongside existing `bg-accent text-accent-foreground` so today stands out even when accent is subtle

### Files to Change

1. `src/index.css` — add `option` and `option:checked` rules inside `.calendar-dropdown`
2. `src/components/ui/calendar.tsx` — update `dropdown` and `day_today` classNames for better palette adherence

These are 2 small edits. No new files, no schema changes, no new dependencies.

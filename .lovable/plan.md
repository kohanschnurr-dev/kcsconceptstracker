
## Fix Calendar Date Picker Dropdowns

### Problem
The month and year dropdowns in the date picker use native HTML `<select>` elements with `captionLayout="dropdown-buttons"`. These render as unstyled white dropdown lists that look broken against the dark theme (as seen in the screenshots).

### Solution
Update `src/components/ui/calendar.tsx` to properly style the native dropdowns so they match the dark theme:

1. **Style the dropdown `<select>` elements** with dark background, proper text color, border styling, and themed scrollbar behavior so the open dropdown list matches the app's dark UI
2. **Extend the year range** from +/-5 years to +/-10 years for easier long-range navigation
3. **Add proper option styling** using CSS in `src/index.css` to style the `<option>` elements inside the dropdowns (since `<option>` elements can only be styled via limited CSS properties)

### Files Changed
- **Edit**: `src/components/ui/calendar.tsx` -- Update dropdown classNames with dark-theme-compatible styling (`bg-popover text-popover-foreground border-border`), extend year range to +/-10
- **Edit**: `src/index.css` -- Add a small CSS rule to style `<option>` elements within the calendar dropdowns with dark backgrounds

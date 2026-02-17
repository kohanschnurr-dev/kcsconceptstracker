
## Fix Calendar Dropdown Theme

### Problem
The native month/year `<select>` dropdowns in the calendar are rendering with white backgrounds and dark text, breaking the dark theme (visible in the screenshot).

### Solution
Native `<select>` dropdown lists are notoriously hard to style with CSS alone. The most reliable cross-browser fix is to apply `color-scheme: dark` on the select elements themselves, which tells the browser to render the entire dropdown widget (including the opened option list) in dark mode.

### Files Changed

**`src/index.css`** -- Add `color-scheme: dark` to the `.calendar-dropdown` rule and ensure the select element itself gets dark rendering:

```css
.calendar-dropdown {
  max-height: 200px;
  overflow-y: auto;
  color-scheme: dark;
  background-color: hsl(220 18% 13%);
  color: hsl(210 20% 95%);
}
```

This forces the browser to use its built-in dark-mode rendering for the native select dropdown, matching the app's dark theme without fighting browser-specific option styling limitations.

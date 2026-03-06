

## Fix: Layout Shift When Dialog Opens

**Problem**: When clicking a feature card, the Radix Dialog locks scrolling on the body and removes the scrollbar, causing all content behind the overlay to shift horizontally.

**Solution**: Add `scrollbar-gutter: stable` to the `<body>`/`<html>` element in `src/index.css`. This reserves space for the scrollbar at all times, so when the dialog removes it, nothing shifts.

### Changes

**`src/index.css`** — Add one CSS rule to `html`:
```css
html {
  scrollbar-gutter: stable;
}
```

This is the cleanest fix — no component changes needed, works globally for all dialogs across the site.


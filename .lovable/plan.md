

## Fix: Background Content Shift Behind Dialog

**Problem**: `scrollbar-gutter: stable` fixed the header, but the background content behind the overlay still jumps when the dialog opens because Radix UI adds `overflow: hidden` to `<body>`, removing the scrollbar. The gutter on `html` doesn't prevent `body`'s scrollbar from disappearing.

**Solution**: Override Radix's body scroll-lock padding compensation in CSS. When Radix hides the scrollbar, it adds `padding-right` to body to compensate — but this doesn't always work correctly with `scrollbar-gutter: stable`. We need to ensure the body also uses `scrollbar-gutter: stable` and neutralize Radix's inline padding-right override.

### Changes

**`src/index.css`** — Add rules to prevent the shift:

```css
html, body {
  scrollbar-gutter: stable;
}

/* Prevent Radix dialog from adding padding-right that causes layout shift */
body[data-scroll-locked] {
  padding-right: 0 !important;
  margin-right: 0 !important;
}
```

Remove the existing standalone `html { scrollbar-gutter: stable; }` rule and replace with the above.

Single file change, no component modifications needed.


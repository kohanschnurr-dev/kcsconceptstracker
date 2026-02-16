

## Fix Dropdown Text Contrast Across All Palettes

### Problem
When a dropdown menu item is highlighted (focused/hovered), the background changes to the `accent` color and the main text changes to `accent-foreground`. However, child elements with explicit color classes like `text-muted-foreground` and `text-primary` keep their original colors, causing poor contrast on the highlighted background. This affects the Baselines section and potentially other dropdown menus across the app.

### Root Cause
The shadcn DropdownMenuItem component applies `focus:text-accent-foreground` only to the root element. Child `span` and `button` elements with hardcoded text color classes override the inherited color and become unreadable against the accent background.

### Solution: Global CSS Fix + TemplatePicker Cleanup

Rather than adding `group-data-[highlighted]` classes to every child element in every dropdown, add a single global CSS rule that forces all text within highlighted dropdown items to inherit the foreground color. This fixes the issue everywhere at once, for all current and future palettes.

**File: `src/index.css`** -- Add one utility rule:
```css
/* Force all child text in highlighted dropdown items to inherit accent-foreground */
[data-highlighted] .text-muted-foreground,
[data-highlighted] .text-primary {
  color: hsl(var(--accent-foreground)) !important;
}
```

**File: `src/components/budget/TemplatePicker.tsx`** -- Clean up the now-redundant `group-data-[highlighted]/item:text-accent-foreground` classes from the saved budgets section (lines 359, 364) since the global rule handles it. Also remove the `group/item` class from the DropdownMenuItem (line 341).

### Coverage
This global rule covers:
- Baseline tier descriptions and prices (the screenshot issue)
- Saved budget dollar amounts and delete icons
- Any other dropdown across the app (Vendors, Documents, etc.) that uses `text-muted-foreground` or `text-primary` inside items
- Works identically across all 10 palettes (Ember, Graphite, Slate, Onyx, Titanium, Midnight, Cobalt, Ivory, Pearl, Linen) since it uses the CSS variable values

### Files Changed
- `src/index.css` (one CSS rule addition)
- `src/components/budget/TemplatePicker.tsx` (cleanup of redundant group classes)

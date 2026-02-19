
## Fix: Calendar Month/Year Dropdown Ignoring Theme Colors

### Root Cause

The screenshot shows the calendar's month/year select dropdowns rendering with a white/light background and black text regardless of the active palette.

There are two connected problems:

**Problem 1 — `calendar-dropdown` CSS class is hardcoded to Ember dark values**

In `src/index.css`, the `.calendar-dropdown` class has:
```css
.calendar-dropdown {
  background-color: hsl(220 18% 13%);   /* Hardcoded Ember dark card color */
  color: hsl(210 20% 95%);              /* Hardcoded Ember light foreground */
}
```

This is not theme-aware at all. Switching to any other palette — dark or light — leaves the dropdown hardcoded to Ember's specific HSL values. On light palettes (Ivory, Pearl, Linen) it's especially broken: a near-white calendar gets a dark navy dropdown.

**Problem 2 — `color-scheme` on `<html>` doesn't propagate into the `<select>` element's native dropdown UI**

The native `<option>` popup rendered by the browser (the part that appears when you click the month/year selector) uses the OS color scheme, not CSS variables. This is why it can flash white/black even when the surrounding calendar looks correct.

**Problem 3 — `applyPalette()` doesn't reset variables that were set by a previous palette**

When switching from a light palette (Ivory/Pearl/Linen — which define their own `--foreground`, `--card-foreground` etc. overriding the `shared` object) back to a dark palette, the old palette's inline style overrides persist because `applyPalette()` only calls `setProperty` on keys present in the new palette — it never clears stale inline properties. This means after cycling through palettes, leftover color values can bleed through.

### The Fix

**File 1: `src/index.css`** — Replace the hardcoded `calendar-dropdown` colors with CSS variable references:

```css
/* BEFORE */
.calendar-dropdown {
  max-height: 200px;
  overflow-y: auto;
  color-scheme: dark;
  background-color: hsl(220 18% 13%);
  color: hsl(210 20% 95%);
}

/* AFTER */
.calendar-dropdown {
  max-height: 200px;
  overflow-y: auto;
  color-scheme: inherit;
  background-color: hsl(var(--popover));
  color: hsl(var(--popover-foreground));
}
```

This makes the dropdown always match the active palette's popover color. Setting `color-scheme: inherit` propagates the root `color-scheme` value (set by `applyPalette()` as `light` or `dark`) into the select so the native browser dropdown also respects it.

**File 2: `src/lib/colorPalettes.ts`** — Fix `applyPalette()` to clear all known CSS variables before applying new ones, preventing stale values from light→dark or dark→light palette switches:

```typescript
// Add a complete list of all CSS variable keys used across all palettes
const ALL_PALETTE_VARS = [
  '--background', '--foreground', '--card', '--card-foreground',
  '--popover', '--popover-foreground', '--primary', '--primary-foreground',
  '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
  '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
  '--success', '--success-foreground', '--warning', '--warning-foreground',
  '--border', '--input', '--ring', '--radius',
  '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5',
  '--sidebar-background', '--sidebar-foreground', '--sidebar-primary',
  '--sidebar-primary-foreground', '--sidebar-accent', '--sidebar-accent-foreground',
  '--sidebar-border', '--sidebar-ring',
];

export function applyPalette(key: PaletteKey) {
  const palette = palettes.find((p) => p.key === key);
  if (!palette) return;
  const root = document.documentElement;
  // Clear all palette vars first to prevent stale overrides from previous palette
  ALL_PALETTE_VARS.forEach((prop) => root.style.removeProperty(prop));
  // Apply new palette
  Object.entries(palette.variables).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
  // ... rest unchanged
}
```

### Why This Fixes All Palettes

| Palette | Before | After |
|---|---|---|
| Ember (dark) | Calendar dropdown shows Ember-specific dark (coincidentally correct) | Uses `--popover` CSS var — still correct |
| Graphite/Slate/Onyx/Titanium/Midnight/Cobalt (dark) | Calendar dropdown shows wrong Ember dark hue | Uses correct palette's `--popover` color |
| Ivory/Pearl/Linen (light) | Calendar dropdown shows dark navy background on light palette | Uses correct light popover color |

### Files to Change

- `src/index.css` — 2 line changes in `.calendar-dropdown` rule (lines 145–152)
- `src/lib/colorPalettes.ts` — Add `ALL_PALETTE_VARS` constant + update `applyPalette()` to clear stale properties before applying (lines 383–398)

### What Stays the Same

- All palette color values unchanged
- All `Calendar` component classNames unchanged
- All `applyPalette()` behavior unchanged except for the pre-clear step
- The `LIGHT_PALETTES` / `color-scheme` logic unchanged

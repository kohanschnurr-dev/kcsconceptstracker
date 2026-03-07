

## Plan: Change primary accent color to #FFB300

**What:** Replace the current orange accent (`hsl(30, 100%, 55%)`) with the industrial gold `#FFB300` (`hsl(42, 100%, 50%)`) across all theme definitions.

**File:** `src/lib/colorPalettes.ts` — update the `--primary`, `--accent`, `--ring`, `--chart-1`, and sidebar primary/ring variables in the "Industrial" palette (and any default palette) from `30 100% 55%` to `42 100% 50%`.

**File:** `src/index.css` — update all instances of `30 100% 55%` in both `:root` and `.dark` blocks, plus the `gold-glow` / `gold-glow-sm` / `blueprint-grid` utility classes that reference `hsl(30 100% 55% / ...)` to use `42 100% 50%` instead.

Two files, find-and-replace of the HSL value.


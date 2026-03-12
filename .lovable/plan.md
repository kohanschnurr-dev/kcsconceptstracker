

## Plan: Theme-Align GoalsPopout and RulesPopout

### Problem
The Goals and Rules popups use hardcoded Slate colors (`text-slate-400`, `bg-slate-800`, `border-slate-700`, `text-white`, etc.) and a custom `overlay-dashboard-panel-rounded` CSS class with hardcoded dark gradients. This means they ignore the user's chosen color palette from Settings. The Spending and Categories popouts already use the Dialog component with proper theme variables and look correct.

### Approach
Replace all hardcoded Slate/white color references with theme CSS variable classes (`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-secondary`, `border-border`, etc.) in both files. Replace the custom overlay panel class with theme-aware equivalents.

### Changes

**`src/components/ops/GoalsPopout.tsx`** (~40 class replacements)
- Panel container: `overlay-dashboard-panel-rounded` → `bg-card border border-border rounded-2xl shadow-2xl`
- Backdrop: keep `overlay-dashboard` (just a blur backdrop, fine as-is)
- All `text-white` → `text-foreground`
- All `text-slate-400`, `text-slate-500` → `text-muted-foreground`
- All `text-slate-200`, `text-slate-100`, `text-slate-300` → `text-foreground`
- All `bg-slate-800/*` → `bg-secondary/*`
- All `border-slate-700/*`, `border-slate-600` → `border-border`
- Summary banner gradient → `bg-muted/50 border border-border`
- Goal cards gradient → `bg-card/60 border-border`
- Input backgrounds: `bg-slate-800/80 border-slate-600` → `bg-secondary border-border`
- Hover states: `hover:bg-slate-700` → `hover:bg-secondary`
- Unfilled segments: `bg-slate-700/50` → `bg-muted`

**`src/components/ops/RulesPopout.tsx`** (~45 class replacements)
- Same panel/backdrop treatment as Goals
- Same slate→theme variable mappings throughout
- `SortableGroupRow`: `bg-slate-800/50 border-slate-700/40` → `bg-secondary/50 border-border/40`
- Rule card text: `text-slate-100` → `text-foreground`
- All form inputs, labels, buttons: same pattern as Goals
- Group count badge: `bg-slate-800/60` → `bg-secondary/60`

**`src/index.css`** (1 change)
- Update `.overlay-dashboard-panel-rounded` to use CSS variables instead of hardcoded rgba slate values:
  ```css
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  ```

### Result
Both popups will inherit whatever color palette the user selects in Settings, matching the rest of the app.


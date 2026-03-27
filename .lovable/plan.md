

## Plan: Theme-Align Goals & Rules Widgets

### Problem
The Goals and Rules widget cards in `CompactDashboardWidgets.tsx` use hardcoded Tailwind colors (e.g. `from-cyan-950/30 to-slate-900/50`, `text-cyan-300`, `text-slate-400`, `bg-slate-700/60`) instead of semantic CSS variables. This looks wrong on any theme that isn't the default dark palette.

### Fix

**File: `src/components/ops/CompactDashboardWidgets.tsx`** — lines 211-320

Replace all hardcoded color references in the Goals and Rules widgets with semantic theme tokens:

| Hardcoded | Replacement |
|-----------|-------------|
| `border-cyan-500/30`, `border-amber-500/30`, `border-emerald-500/30`, `border-red-500/30` | `border-primary/30` (or `border-success/30`, `border-destructive/30` for rules) |
| `bg-gradient-to-br from-cyan-950/30 to-slate-900/50` | `bg-primary/5` |
| `bg-gradient-to-br from-emerald-950/20 to-slate-900/50` | `bg-success/5` |
| `bg-gradient-to-br from-red-950/20 to-slate-900/50` | `bg-destructive/5` |
| `bg-gradient-to-br from-amber-950/20 to-slate-900/50` | `bg-warning/5` |
| `text-cyan-300`, `text-cyan-400` | `text-primary` |
| `text-amber-300`, `text-amber-400` | `text-warning` |
| `text-emerald-300`, `text-emerald-400` | `text-success` |
| `text-red-300`, `text-red-400` | `text-destructive` |
| `text-slate-400` | `text-muted-foreground` |
| `text-slate-200` | `text-foreground` |
| `bg-cyan-500/15`, `bg-amber-500/15`, `bg-emerald-500/15`, `bg-red-500/15` | `bg-primary/15`, `bg-warning/15`, `bg-success/15`, `bg-destructive/15` |
| `bg-slate-700/50`, `bg-slate-700/60` | `bg-muted` |
| `bg-cyan-400`, `bg-amber-400`, `bg-red-400` (progress bars) | `bg-primary`, `bg-warning`, `bg-destructive` |
| `bg-emerald-400` (dots) | `bg-success` |
| `bg-slate-500` (dots) | `bg-muted-foreground` |
| `text-slate-500` | `text-muted-foreground` |
| hover borders follow same pattern | `hover:border-primary/50`, etc. |

This uses the existing semantic color tokens (`primary`, `success`, `warning`, `destructive`, `muted-foreground`) that already adapt to the user's selected palette.

### Scope
- **Goals widget** (lines ~211-263): conditional styles for progress states
- **Rules widget** (lines ~265-320): conditional styles for compliance states

### Files touched
- `src/components/ops/CompactDashboardWidgets.tsx` (~50 lines updated, no logic changes)




## Plan: Make Category Text Much Darker on Calendar

**Problem**: The `-700` text colors (amber-700, purple-700, red-700, etc.) on pastel backgrounds are still too faint. The user wants text that is clearly dark and readable — essentially near-black.

### Change

**`src/lib/calendarCategories.ts`** — Update all `textClass` values to use `-900` shades, which are very dark versions of each color (nearly black but with a color tint):

| Category | Current | New |
|---|---|---|
| acquisition_admin | `text-blue-700` | `text-blue-900` |
| structural_exterior | `text-red-700` | `text-red-900` |
| rough_ins | `text-amber-700` | `text-amber-900` |
| inspections | `text-purple-700` | `text-purple-900` |
| interior_finishes | `text-emerald-700` | `text-emerald-900` |
| milestones | `text-yellow-700` | `text-yellow-900` |

Dark mode values stay as-is (`-200`). The `-900` shades are near-black with enough color tint to still feel categorized, but dark enough to be immediately readable on the pastel `-200` backgrounds used for Gantt bars, dropdown headings, and task cards.

**Files**: `src/lib/calendarCategories.ts` only (6 line edits)


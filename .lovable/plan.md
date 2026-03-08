

## Plan: Fix Value Summary Step Formatting

The screenshot shows the stat cards have text that's too large and wrapping awkwardly (e.g., "~28 hrs/mo" breaking across lines), and the overall spacing feels cramped.

### Changes in `src/pages/GetStarted.tsx`

1. **ValueStat component** (lines 139-146): Reduce the large heading from `text-3xl sm:text-4xl` to `text-2xl sm:text-3xl`, add `whitespace-nowrap` to prevent line breaks, and tighten padding from `p-6` to `p-4 py-5`.

2. **Stat cards grid** (line 417): Ensure `sm:grid-cols-3` cards have equal sizing with `auto-cols-fr` and reduce gap from `gap-4` to `gap-3`.

3. **Pain point cards** (lines 446-461): Reduce vertical spacing between cards, tighten padding from `px-4 py-3` to `px-3 py-2.5` for a cleaner list appearance.

4. **Overall section spacing** (line 404): Reduce top-level `space-y-8` to `space-y-6` so the whole step feels less spread out.


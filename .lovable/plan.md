

## Fix Construction Budget Inline Edit Formatting

The edit input for "Construction Budget" in the MAO gauge looks cramped — the `$` prefix and narrow input don't align well with the label, and the field is too small for comfortable entry.

**Changes in `src/components/budget/MAOGauge.tsx`:**

1. **Widen the input** from `w-28` to `w-32` so larger numbers fit without clipping
2. **Match the font size** to the display value (`text-base`) instead of `text-sm` so the edit state doesn't visually "shrink"
3. **Remove the separate `$` span** — use a cleaner approach with the `$` built into the input padding (matching BudgetCategoryCard pattern with a `$` icon overlay)
4. **Add `border-primary/50`** to the input so it's visually distinct as editable (matches gold accent theme)
5. **Ensure consistent height** — use `h-8` instead of `h-7` to match the line height of the display text


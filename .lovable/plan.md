

## Tighten Profit Calculator Breakdown UI

### Problem
The breakdown panel for Closing/Holding costs has excessive gaps between the toggle buttons, inputs, and labels. The layout feels spread out and awkward, especially when toggling between % and $ modes.

### Changes

**`src/components/project/ProfitCalculator.tsx`**:

1. **Compact the toggle buttons**: Reduce padding on the %/$ toggle segments, make them smaller and tighter against the label text
2. **Tighten input widths**: Make the percentage input narrower (w-8 instead of w-10) and the flat dollar input more compact (w-16 instead of w-20)
3. **Remove extra gaps**: Reduce `gap-1` spacing in the flex containers to `gap-0.5`, remove unnecessary margin on the toggle (`ml-1` to `ml-0.5`)
4. **Align parentheses closer**: Pull the "(" and "% ARV)" / "% PP)" labels tighter to the input field
5. **Consistent line height**: Ensure the cost lines with toggles align vertically with the simpler lines above them by using `items-center` consistently and matching text sizes

### Visual Result (before vs after)

Before: `- Closing Costs  [%|$]  (  1  % ARV)          $12,270`

After: `- Closing Costs [%|$] (1 % ARV)                $12,270`

Tighter spacing, smaller toggle, narrower inputs -- everything feels inline and intentional rather than scattered.


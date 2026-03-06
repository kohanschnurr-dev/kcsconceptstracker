

## Plan: Redesign the "Save ~13%" badge

Move "Save ~13%" from inline text hanging off "Annual" into a small pill/badge sitting below the entire toggle row, centered. This keeps the toggle row clean and gives the savings callout its own visual weight.

### Changes

**`src/pages/Pricing.tsx`** (lines 98-126)

- Remove the `Save ~13%` span from inside the "Annual" label
- Add a small centered pill badge below the toggle row: `bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full` with text "Save ~13% with annual billing"
- Wrap toggle + badge in a flex-col container with a small gap


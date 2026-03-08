

## Plan: Replace "3 tools → 1" with a scalability stat

### Change in `src/pages/GetStarted.tsx`

1. **Replace the third `ValueStat`** (lines 443-448) with a scalability-focused card:
   - Change to something like: value based on team size multiplier (e.g. `2x` or `3x`), suffix `"x capacity"`, label `"Scale without extra hires"`
   - This communicates the ability to handle more projects/volume with the same team

2. **Update grid** from `sm:grid-cols-3` to `sm:grid-cols-2` if we want only two cards, **or** keep three with the new scalability card. Given the user wants to highlight scalability, keeping three cards with the replacement makes sense.

3. **Add a `capacityMultiplier`** to the metrics calculation — a simple formula like `Math.max(2, Math.round(teamSize * 1.5))` to give a personalized scaling factor.


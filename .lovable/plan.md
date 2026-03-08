

## Plan: Condense pricing page to fit desktop viewport

The main issue is 14 Solo features creating a very tall card, plus generous padding/margins throughout. Here's how to make it all fit without scrolling on desktop:

### Changes in `src/pages/Pricing.tsx`

1. **Tighten top/bottom padding**: `pt-28 pb-20` → `pt-24 pb-8` on the main section

2. **Reduce heading/toggle margins**: `mb-10` on subtitle → `mb-6`, `mb-10` on toggle → `mb-6`

3. **Consolidate Solo features** — trim from 14 to ~8 by grouping related items:
   - "Budget tracking & cost breakdowns" stays
   - "Draw request management" stays
   - "Sub/vendor management" stays
   - "Timeline & milestone tracking" stays
   - "Photo & document storage (5 GB)" (merge photo documentation + document storage)
   - "Material tracking & daily logs" (merge two items)
   - "Reporting & CSV export" (merge two items)
   - "Mobile access · Email support" (merge two items)
   - Remove "Single user" (implied by Solo name) and "Unlimited projects" can stay

4. **Reduce card internal padding**: `p-8` → `p-6` on both cards

5. **Reduce feature list spacing**: `space-y-3` → `space-y-2`

6. **Reduce card bottom margin**: `mb-20` → `mb-10`

7. **Move FAQ below the fold** — it's secondary content, acceptable to scroll for it. Reduce its top margin.

This keeps the pricing cards + toggle + heading fitting comfortably in one desktop viewport while the FAQ section lives just below the fold.


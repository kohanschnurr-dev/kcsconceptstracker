

## Plan

Two parts: (1) show the complementary value on each budget card, and (2) brainstorm a "New Construction Calculator" concept.

---

### Part 1: Show Complementary $/PSF or $ Value

**File: `src/components/budget/BudgetCategoryCard.tsx`**

Add a small helper text line below (or to the right of) the input that shows the opposite calculation:

- **When in $ mode** and a value is entered → show `$X.XX/sf` in muted `text-[9px]` below the input
- **When in $/sf mode** and a rate is entered → show `$X,XXX` total in muted `text-[9px]` below the input
- Only visible when `hasSqft` is true and the input has a non-zero value

This is a small read-only hint, not a second input. Keeps the card compact while giving instant context.

**Implementation**: After the input `<div>`, conditionally render a `<span>` with the computed complementary value. No new state needed — it's derived from existing `value`, `psfRate`, and `sqftNum`.

---

### Part 2: "New Construction Calculator" — Concept Ideas

Here are concepts for a timeline-first calculator tailored to new builds (ground-up), distinct from the current rehab-focused calculator:

**Concept A — Phase-Gated Draw Schedule**
- Timeline is the primary view (not Category)
- Each phase has a start/end date, draw amount, and % complete
- Phases unlock sequentially — can't budget Phase 4 until Phase 3 is marked complete or in-progress
- Integrated draw request generation: click a phase → generate a draw request PDF with line items, amounts, and completion %
- Bank/lender view: shows cumulative draws vs. total loan commitment

**Concept B — CSI Division Structure**
- Organized by CSI MasterFormat divisions (Division 01–33) instead of trade groups
- Each division has standard subcategories pre-populated
- Better alignment with commercial construction specs and contractor bids
- Import contractor bids by division and auto-map to budget lines

**Concept C — Construction Schedule + Budget Hybrid**
- Gantt-style timeline where each bar IS a budget line item
- Bar length = duration, bar color = cost type (hard/soft), bar height or label = budgeted amount
- Drag bars to reschedule, adjust duration to affect holding costs automatically
- Cash flow curve overlaid on the timeline showing cumulative spend over time
- Critical path highlighting: which trades are sequential vs. parallelizable

**Concept D — Milestone-Based Progressive Billing**
- Define milestones (Foundation Complete, Dried In, Rough Complete, Trim Complete, Final)
- Each milestone has a target % of total budget and target date
- Budget items are assigned to milestones, not phases
- Dashboard shows: milestone progress, budget burn rate vs. plan, projected completion date
- S-curve visualization comparing planned vs. actual spend

**Recommendation**: Concept C (Schedule + Budget Hybrid) is the most differentiated and powerful — it merges the existing Gantt calendar with the budget calculator into a single unified view. It would reuse the existing timeline phases, DnD infrastructure, and category budget data.

---

### Files for Part 1
- `src/components/budget/BudgetCategoryCard.tsx` — add complementary value hint


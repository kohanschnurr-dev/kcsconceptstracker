

## Redesign Project Report to Match Reference Quality

### What's Changing

The current report uses basic shadcn Cards with small text. The reference HTML (`wales-rental-report-v2.html`) has a dramatically more polished look: dark header band, large typography, monospace number labels, section divider lines, gradient progress bars, and a category breakdown with per-item horizontal bars + budget marker ticks. This rewrite matches that visual standard while keeping all existing data logic intact.

### Visual Changes (Reference -> Implementation)

1. **Header**: Full-width dark band (`bg-background`) with company name in uppercase gold (`text-primary`), project name at `text-4xl font-extrabold text-foreground`, meta items in monospace muted text, "Project Report" pill badge, and logo top-right.

2. **Section Headers**: New pattern -- uppercase primary-colored label + horizontal divider line (`border-border`) spanning the row, used before every section. Replaces the current plain CardTitle approach.

3. **Budget Snapshot Cards**: Larger, with monospace `text-[9px] uppercase tracking-[2.5px]` labels, `text-2xl font-extrabold` values, a sub-line (e.g., "Approved", "103.6% used"), and a 3px colored top pseudo-border via `border-t-[3px]`. Placed in a 4-column grid.

4. **Budget Bar**: Own card with bar header (title left, pct right in monospace), 10px-tall track with gradient fill (`from-primary to-destructive` when over, `bg-primary` when under), monospace sub-labels.

5. **Deal Financials Section**: Card with dark header band (`bg-background text-primary`), "How We Get to ROI" title, and a "Values pulled from project Financials tab" note with a pulsing dot. Two-column grid where each row is a flex row with label and monospace value separated by a subtle bottom border. Placeholder values render as italic muted text with rounded background. ROI result strip at bottom: 3 stats in a grid with large `text-3xl` values. 70% Rule indicator below.

6. **Category Breakdown (replaces Over/Under + Bars)**: Combined into one card matching the reference. Each category is a row: name left, spent/budget right in monospace, then a thin horizontal bar with the spent fill + a vertical budget marker tick. Red fill if over, primary if under, dim if no budget. Sorted by spend descending.

7. **Donut Chart ("Where the Money Went")**: Keep recharts PieChart but update the legend to a 2-column grid with colored dots, labels, and monospace values -- matching the reference layout.

8. **Scope Creep / Unbudgeted**: Stays as amber callout, hidden if none.

9. **Footer**: Company name in gold uppercase left, project info in monospace right.

10. **Print Styles**: Updated to handle new layout. Hide action bar, force white backgrounds for readability, disable animations.

11. **Animations**: `@keyframes up` (translateY + opacity) with staggered delays per section. Bar fills animate via CSS transition on width.

### Technical Details

**File: `src/components/project/ProjectReport.tsx`** -- Complete visual rewrite

- All computed data logic (lines 1-204) stays exactly the same
- The render JSX is fully restructured to match the reference's HTML patterns
- Uses only existing CSS variables: `--primary`, `--background`, `--foreground`, `--border`, `--muted-foreground`, `--destructive`, `--success`, `--card`, `--secondary`
- Monospace numbers use `font-mono` (maps to JetBrains Mono already imported)
- No new dependencies needed
- The "Over/Under Budget" two-column section (Section 5) is removed and replaced by the category breakdown bars which visually communicate the same information more effectively (matching the reference)
- The "Days on Project" timeline section is kept but restyled to match the card/typography patterns

### Files Changed

- `src/components/project/ProjectReport.tsx` -- full visual rewrite of render JSX and inline print styles; all data logic preserved


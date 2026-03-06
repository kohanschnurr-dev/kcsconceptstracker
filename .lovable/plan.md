

## Plan: Revamp Stats Row with compelling metrics & count-up animation

### New Stats (more persuasive, outcome-focused)
1. **500+** — "Hours Saved Per Year"
2. **98%** — "Budget Accuracy"
3. **5x** — "Faster Draw Requests"
4. **$0** — "To Get Started"

### Count-Up Animation
- Use a custom `useCountUp` hook with `requestAnimationFrame` that triggers when the element becomes visible (via IntersectionObserver)
- Each stat animates from 0 to its target number over ~1.5s with an ease-out curve
- Handle prefixes (`$`) and suffixes (`+`, `%`, `x`) separately from the numeric value
- Stats data will store `numericValue`, `prefix`, `suffix`, and `label`

### File Changes
**`src/components/landing/StatsRow.tsx`** — Full rewrite:
- Define stats with structured data: `{ value: 500, prefix: "", suffix: "+", label: "Hours Saved Per Year" }`
- Create inline `CountUpStat` component using `useEffect` + `IntersectionObserver` + `requestAnimationFrame`
- Animate numbers from 0 to target with easeOutQuart over 1.5s
- Keep existing scroll-reveal classes and hover-gold-glow styling


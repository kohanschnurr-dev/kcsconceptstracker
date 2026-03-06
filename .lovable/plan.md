

## Plan: Add Glow Effects and Scroll Animations to Landing Page

### 1. Gold Glow on Hover for Cards (4 sections)

Add `gold-glow-sm` on hover to cards in:
- **PlatformOverview.tsx** — each module card gets `hover:gold-glow-sm` (via a custom CSS transition)
- **Testimonials.tsx** — each testimonial card
- **StatsRow.tsx** — each stat block
- **BuiltFor.tsx** — each persona card

Since `box-shadow` via utility classes needs a hover variant, I'll add a `.hover-gold-glow` CSS class that applies the glow on `:hover` with a transition.

### 2. CSS: New Animation Classes (index.css)

Add to `index.css`:
- `.hover-gold-glow` — applies `gold-glow-sm` on hover with smooth transition
- Intersection Observer-based approach using a reusable `useScrollReveal` hook that adds classes when elements enter viewport
- Stagger delay utilities (`.stagger-1`, `.stagger-2`, etc.) for cascading card reveals
- `.scroll-hidden` (opacity 0, translateY 30px) and `.scroll-visible` (animated to visible)
- `.scroll-slide-left` / `.scroll-slide-right` for side-sliding headings

### 3. Reusable Hook: `useScrollReveal`

Create `src/hooks/useScrollReveal.ts` — uses `IntersectionObserver` to toggle a `.scroll-visible` class on elements with `data-reveal` attribute. Called once in the Landing page component.

### 4. Hero Entrance Animation (Hero.tsx)

On mount, fade-in + scale the headline, subtitle, and CTA buttons with staggered delays using CSS animation classes applied via state or direct class names with animation-delay.

### 5. Section-by-Section Animations

| Section | Animation |
|---|---|
| **Hero** | Fade-in + scale on load (staggered: title → subtitle → buttons) |
| **PlatformOverview** | Heading fades up, cards stagger in (cascade) |
| **StatsRow** | Numbers fade up with stagger |
| **CostCalculator** | Already has glow; heading fades up |
| **BuiltFor** | Cards stagger in from bottom |
| **Testimonials** | Cards stagger in |
| **FAQ** | Heading fades up, items fade up |
| **FinalCTA** | Heading + button fade up |

### Files to Create/Edit

1. **Create** `src/hooks/useScrollReveal.ts` — IntersectionObserver hook
2. **Edit** `src/index.css` — add `.hover-gold-glow`, `.scroll-hidden`, `.scroll-visible`, stagger delays
3. **Edit** `src/components/landing/Hero.tsx` — add entrance animations
4. **Edit** `src/components/landing/PlatformOverview.tsx` — add reveal + glow
5. **Edit** `src/components/landing/StatsRow.tsx` — add reveal + glow
6. **Edit** `src/components/landing/BuiltFor.tsx` — add reveal + glow
7. **Edit** `src/components/landing/Testimonials.tsx` — add reveal + glow
8. **Edit** `src/components/landing/FAQ.tsx` — add reveal
9. **Edit** `src/components/landing/FinalCTA.tsx` — add reveal
10. **Edit** `src/components/landing/CostCalculator.tsx` — add reveal to heading
11. **Edit** `src/pages/Landing.tsx` — call `useScrollReveal()` hook




## Add Scroll Indicator to Hero Section

**Problem**: The hero takes up the full viewport and there's no visual cue telling visitors to scroll down for more content.

**Change**: Add an animated bouncing chevron/arrow at the bottom of the hero section that smoothly scrolls to the next section on click.

### `src/components/landing/Hero.tsx`
- Import `ChevronDown` from lucide-react
- Add an absolutely-positioned bouncing chevron at the bottom center of the hero section
- On click, smooth-scroll to the next section (Built For) using `window.scrollBy` or a ref
- Use Tailwind's `animate-bounce` for the pulsing effect
- Include a subtle "Explore Features" or "See More" label beneath the arrow for extra clarity

### `src/components/landing/BuiltFor.tsx`
- Add an `id="built-for"` to the section element so the scroll target works cleanly


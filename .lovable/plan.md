

## Fix Scroll Arrow Target

The arrow in the Hero currently scrolls to `#built-for`, but FeaturesGrid is now the first section after the hero. Two changes needed:

### 1. `src/components/landing/FeaturesGrid.tsx` (line 9)
Add `id="features"` to the section element.

### 2. `src/components/landing/Hero.tsx` (line 56)
Change `getElementById("built-for")` → `getElementById("features")`.


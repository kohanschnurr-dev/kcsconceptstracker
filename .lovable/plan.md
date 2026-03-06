

## Move PlatformOverview Up & Remove FeaturesGrid

### Changes

1. **`src/pages/Landing.tsx`**
   - Move `PlatformOverview` to directly after `Hero` (so the scroll arrow lands on it)
   - Remove `FeaturesGrid` entirely from the page
   - Remove the `FeaturesGrid` import

2. **`src/components/landing/PlatformOverview.tsx`**
   - Add `id="features"` to the `<section>` element so the Hero's scroll-down arrow targets it correctly

3. **`src/components/landing/Hero.tsx`** — no changes needed (already scrolls to `#features`)

### Result
Landing page order: Hero → **PlatformOverview** → BuiltFor → FeatureShowcase → IntegrationStrip → ...


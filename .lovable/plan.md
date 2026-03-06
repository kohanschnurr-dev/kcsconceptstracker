

## Plan: Remove the `/features` page

The `/features` page (`LandingFeatures.tsx`) is a standalone "All Features" grid page. Removing it involves:

### Changes

1. **Delete** `src/pages/LandingFeatures.tsx`

2. **`src/App.tsx`** — Remove the import of `LandingFeatures` and the `<Route path="/features" ...>` line. Keep the `/features/:slug` route for individual feature detail pages.

3. **`src/components/landing/FeaturesGrid.tsx`** — The "See all features" card links to `/features`. Update it to link to `/#platform` (the Platform Overview section on the landing page) instead, or remove that card entirely.

4. **`src/pages/FeatureDetail.tsx`** — Update the "Back to features" link from `/features` to `/#platform`.

No other files reference this page.




## Plan: Replace GroundWorks logo across the app

Copy the new logo file to `src/assets/` and update all three files that reference the old GroundWorks brand logos. The Sidebar/MobileNav business logo (`kcsLogo` / `logoUrl` from company settings) will NOT be touched.

### Steps

1. **Copy uploaded logo** to `src/assets/groundworks-logo-new.png`

2. **Update imports** in these 3 files:
   - `src/components/landing/LandingHeader.tsx` — change import from `groundworks-helmet-logo.png` to the new logo
   - `src/pages/GetStarted.tsx` — change import from `groundworks-helmet-logo.png` to the new logo
   - `src/pages/Auth.tsx` — change import from `groundworks-app-logo.png` to the new logo

3. **Update favicon** in `index.html` — copy logo to `public/favicon.png` and reference it

No other files affected. The Sidebar, MobileNav, and settings company logo are untouched.


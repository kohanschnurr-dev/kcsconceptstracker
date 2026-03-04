

## Refine Auth Page Polish

### Changes to `src/pages/Auth.tsx`

1. **Replace KCS logo with GroundWorks logo** — copy `user-uploads://GroundWorks_5.png` to `src/assets/groundworks-logo.png` and import it instead of `kcs-logo.png` in the left panel (and mobile header)

2. **Change headline** — replace "Construction Budget Tracking Built for Flippers" with something broader, e.g. **"Smarter Project Management Starts Here"**

3. **Remove bottom badge** — delete the "256-bit encrypted | Secured by Lovable Cloud" lock icon + text at the bottom of the left panel

4. **Sleeker typography** — reduce headline font weight from `font-extrabold` to `font-bold`, use `tracking-tight` and a lighter color blend so it feels more refined rather than heavy

### Files
- Copy `GroundWorks_5.png` → `src/assets/groundworks-logo.png`
- Edit `src/pages/Auth.tsx`




## Remove Auth-Aware Behavior from Landing Pages

The landing page is a public marketing site — it should never check login state or show "Go to Dashboard". All CTAs should always say "Start Free Trial" and navigate to `/auth`.

### Changes

**1. `src/components/landing/Hero.tsx`**
- Remove `useAuth` import and `user` state
- Remove conditional logic — `handleTrialClick` always navigates to `/auth`
- Button always shows "Start Your Free Trial"

**2. `src/components/landing/FinalCTA.tsx`**
- Remove `useAuth` import and `user` state
- `handleClick` always navigates to `/auth`
- Button always shows "Start Your Free Trial"

**3. `src/components/landing/LandingHeader.tsx`**
- Remove `useAuth` import and `user` state
- Remove conditional rendering that shows "Go to Dashboard" vs "Log In / Start Free Trial"
- Always show "Log In" + "Start Free Trial" buttons (desktop and mobile)

**4. `src/pages/Pricing.tsx`** and **5. `src/pages/Demo.tsx`**
- Same pattern: remove `useAuth`, always navigate to `/auth`, always show trial CTA text

Five files, all the same change: strip `useAuth` and always show the public-facing CTA.


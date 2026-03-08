

## Plan: Enlarge and animate the center logo, remove top bar branding

**File:** `src/pages/GetStarted.tsx`

### Changes

1. **Remove "GroundWorks" text and logo from the top bar** (lines 463-466) — remove the `<Link>` with the logo and text, keeping only the step counter and progress bar.

2. **Enlarge the center logo on step 1** (line 227) — change from `h-16 w-16` to `h-24 w-24` (or similar) for a more prominent presence.

3. **Add animation to the center logo** — apply a subtle floating/pulse animation using a combination of existing keyframes (e.g., `animate-pulse-glow` for the glow effect) plus a custom gentle bounce or float via inline keyframe or existing utility classes. A simple approach: add `animate-bounce` with a slow timing or a custom `animate-[float_3s_ease-in-out_infinite]` keyframe in the Tailwind config.




## Plan: Add Smooth Fade Transitions Between Onboarding Steps

Currently each step renders with a slide-in entrance but disappears instantly when the step changes, creating a choppy feel.

### Approach

Add a transitioning state that triggers a fade-out before changing the step number, then the new step fades in naturally with the existing `animate-in` classes.

### Changes in `src/pages/GetStarted.tsx`

1. **Add transition state** — new `isTransitioning` boolean state and a `transitionTo` helper function that:
   - Sets `isTransitioning = true` (triggers fade-out CSS)
   - After 250ms, updates the step and sets `isTransitioning = false` (new step fades in)

2. **Replace all direct `setStep` calls** in `handleContinue`, `handleBack`, and auto-advance `setTimeout` callbacks with the new `transitionTo` function.

3. **Wrap the step content** in a container div with dynamic classes:
   ```
   className={`transition-all duration-250 ease-in-out ${
     isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
   }`}
   ```
   This gives a subtle fade-out + slight upward shift before the new content fades in.

4. **Disable Continue/Back buttons** while `isTransitioning` is true to prevent double-clicks during the transition.

No other files need changes.


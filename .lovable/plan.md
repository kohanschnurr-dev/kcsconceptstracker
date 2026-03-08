

## Plan: Fix Choppy Logo Animation on Welcome Step

The logo has both a `float` animation (infinite) and the parent container's `animate-in fade-in` entrance animation competing simultaneously, causing a choppy appearance. The float keyframe starts immediately while the fade-in is still running.

### Changes in `src/pages/GetStarted.tsx` (line 296)

1. **Separate the logo entrance from the float animation** — Use a CSS transition approach: start the logo with `opacity-0` and use a `setTimeout` or CSS `animation-delay` to fade it in smoothly first, then let the float take over. Simplest fix: apply a dedicated smooth `transition-opacity duration-700 ease-out` on the image and delay the float animation start with `animation-delay`.

2. Specifically, change the `<img>` class to:
   - Add `opacity-0 animate-[fadeInFloat_1s_ease-out_0.3s_forwards]` — a combined keyframe that fades in over ~700ms then transitions into the float loop.
   - Or simpler: keep `animate-[float_3s_ease-in-out_infinite]` but add `animation-delay: 0.5s` and a separate fade-in with `opacity-0 animate-[fade-in_0.8s_ease-out_forwards]` using a wrapper element.

**Cleanest approach**: Wrap the logo in a `div` that handles the smooth fade-in (`animate-[fade-in_0.8s_ease-out_0.3s_both]`), while the `img` itself only does the float. This separates concerns and prevents the two animations from conflicting.

### File: `src/pages/GetStarted.tsx` (line 296)
- Wrap `<img>` in a `<div className="animate-[fade-in_0.8s_ease-out_0.3s_both]">`
- Keep `<img>` with only `h-28 w-28 animate-[float_3s_ease-in-out_infinite] drop-shadow-[0_0_25px_hsl(var(--primary)/0.4)]`

This ensures the logo fades in smoothly over 0.8s (with a 0.3s delay for the parent to start its entrance), then the float loops seamlessly underneath.


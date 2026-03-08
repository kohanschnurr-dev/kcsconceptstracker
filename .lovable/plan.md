

## Plan: Hide progress bar on welcome step & increase desktop sizing

### Changes in `src/pages/GetStarted.tsx`

1. **Hide the top bar on step 1 (welcome screen)**
   - Wrap the entire sticky top bar (`lines 621-633`) in a conditional so it only renders when `step > 1`. This removes the progress bar and step indicator from the welcome screen entirely.

2. **Increase content sizing for desktop**
   - **Headings**: Bump question headings from `sm:text-3xl` to `lg:text-4xl` on desktop
   - **Selection cards**: Increase padding and font size at `lg` breakpoint (e.g., `lg:px-6 lg:py-5 lg:text-lg`)
   - **Welcome step**: Increase logo from `h-28 w-28` to `lg:h-36 lg:w-36`, heading from `sm:text-4xl` to `lg:text-5xl`
   - **Max width**: Bump the main content container from `max-w-2xl` to `max-w-3xl` for more breathing room on desktop


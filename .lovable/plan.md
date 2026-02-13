

## Fix: Button Hover Text Color on "View Calendar" / "View Tasks"

### Problem
The outline buttons use the default `hover:text-accent-foreground` from the button variant, which renders as black text on hover — nearly invisible against the dark theme background.

### Solution
**File: `src/components/dashboard/TasksDueTodayBanner.tsx`**

On both the "View Calendar" and "View Tasks" buttons, add `hover:text-primary` to the className so the text stays readable on hover, matching the existing `text-primary` base color.

Current classes include `text-primary hover:bg-primary/10` but the outline variant's default `hover:text-accent-foreground` overrides the text color to black. Adding an explicit `hover:text-primary` will take precedence and keep the text visible.

### Changes
- **View Calendar button**: add `hover:text-primary` to className
- **View Tasks button**: add `hover:text-primary` to className

Single file change, two lines.

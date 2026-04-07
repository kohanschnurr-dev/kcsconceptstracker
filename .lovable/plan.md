

## Make Acquisition/Admin Label Text Darker

### Problem
The "Acquisition/Admin" group label below the Category dropdown in the New Event modal is hard to read against the white background.

### Change

**File: `src/lib/calendarCategories.ts`** (line 25)

Update the `textClass` for `acquisition_admin` from:
```
text-blue-900 dark:text-blue-200
```
to:
```
text-blue-950 dark:text-blue-200
```

`blue-950` is the darkest blue in Tailwind (`#172554`), ensuring maximum contrast against white in light mode while keeping dark mode unchanged.


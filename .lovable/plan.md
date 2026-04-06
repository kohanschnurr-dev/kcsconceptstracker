

## Plan: Make Calendar Task Text Black and Readable

**Problem**: The calendar task chips use category-colored text (`text-blue-950`, `text-amber-950`, etc.) which, despite being "dark" variants, still appear washed out and unreadable against their colored backgrounds in the screenshot. The user wants plain **black text** on all calendar task cards.

**Solution**: Force the task title text to always be black (`text-foreground` for theme compatibility) instead of category-colored text. The colored background + border already conveys the category — the text doesn't need to match.

### Changes

**1. `src/components/calendar/DealCard.tsx`**
- In the **compact** card (line 77-82): Replace `getCategoryColor()` which applies `textClass` (colored text) with only `bgClass` + `borderClass`, and add `text-foreground` so the title is always black/white per theme.
- In the **full** card (line 95-130): Same approach — keep colored backgrounds and borders but force `text-foreground` on text elements.
- Specifically update `getCategoryColor()` (line 64-66) to exclude `textClass` and always include `text-foreground`:
  ```typescript
  const getCategoryColor = (category: string) => {
    const styles = getCategoryStyles(category);
    return `${styles.bgClass} text-foreground ${styles.borderClass}`;
  };
  ```

**2. `src/components/calendar/DealCard.tsx` — Icon visibility**  
- The category icons inside compact cards inherit the button's text color. With `text-foreground` they'll be black, which is fine for readability.

### Files
- `src/components/calendar/DealCard.tsx` (1 function change — `getCategoryColor`)


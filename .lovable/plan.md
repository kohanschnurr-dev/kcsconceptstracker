

## Add Weather Disclaimer Note on Settings Page

Add a small disclaimer note below the existing "Used for weather forecasts on the Calendar" helper text in `src/pages/Settings.tsx`.

### Change

**File: `src/pages/Settings.tsx`** -- Update the helper text line (around line 206 after previous edits) to append a second line with a corporate-style disclaimer:

Current:
```
Used for weather forecasts on the Calendar
```

New:
```
Used for weather forecasts on the Calendar
Disclaimer: Weather data is sourced from third-party providers and is for informational purposes only. Please verify conditions independently before making project-critical decisions.
```

The disclaimer will be styled as a second `<p>` tag with the same `text-xs text-muted-foreground` styling, keeping it subtle but visible.


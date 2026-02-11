

## Fix Rain Warning Emoji Threshold

### Problem
The tooltip shows the rain warning emoji for any precipitation above 0%. It should only display the warning emoji when precipitation exceeds 35%.

### Change

**File: `src/components/calendar/WeatherWidget.tsx`** (line 227-229)

- Change the condition from `day.precipitation > 0` to `day.precipitation > 35`
- This aligns the tooltip warning with the `hasRainWarning` highlight logic already in place

```text
Before:  {day.precipitation > 0 && ( <p>⚠️ ...precipitation</p> )}
After:   {day.precipitation > 35 && ( <p>⚠️ ...precipitation</p> )}
```

One line change, no other files affected.

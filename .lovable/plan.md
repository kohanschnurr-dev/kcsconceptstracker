
## Compact the Quick Add Log Row — Mobile UI Fix

### Problem

The "Quick Add Log" inline form inside the Daily Logs tab has three elements in a single row:
1. A `Textarea` (work performed)
2. A date `Button` showing `📅 Feb 18, 2026` — takes ~120px
3. An "Add Log" `Button` with text — takes ~80px

On mobile, this leaves very little room for the textarea input (the most important element), causing the cramped layout visible in the screenshot.

### Solution

Compress the two right-side buttons to icon-only on mobile:

- **Date button**: Show only the `Calendar` icon (no date text) on mobile. On desktop, keep the full "📅 Feb 18, 2026" label.
- **Submit button**: Change "Add Log" text to just `+` (a `Plus` icon) on mobile. On desktop, keep "Add Log" text.

This frees up ~150px of horizontal space for the textarea on mobile.

### Visual Comparison

**Before (mobile):**
```
[Work performed today...] [📅 Feb 18, 2026] [Add Log]
```

**After (mobile):**
```
[Work performed today...                    ] [📅] [+]
```

**Desktop: unchanged** — full labels still shown.

### Technical Changes

#### `src/pages/ProjectDetail.tsx`

**1. Date button** — hide date text on mobile, show only icon:

```tsx
// Before:
<Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs">
  <Calendar className="h-3.5 w-3.5" />
  {format(parseDateString(quickLogDate), 'MMM d, yyyy')}
</Button>

// After:
<Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs px-2 sm:px-3">
  <Calendar className="h-3.5 w-3.5" />
  <span className="hidden sm:inline">{format(parseDateString(quickLogDate), 'MMM d, yyyy')}</span>
</Button>
```

**2. Submit button** — show `+` icon only on mobile, "Add Log" text on desktop:

```tsx
// Before:
<Button type="submit" size="sm" disabled={!quickLogWork.trim() || quickLogSubmitting}>
  {quickLogSubmitting ? 'Saving...' : 'Add Log'}
</Button>

// After:
<Button type="submit" size="sm" disabled={!quickLogWork.trim() || quickLogSubmitting} className="shrink-0 px-2 sm:px-3">
  {quickLogSubmitting ? (
    <span className="hidden sm:inline">Saving...</span>
  ) : (
    <>
      <Plus className="h-4 w-4 sm:hidden" />
      <span className="hidden sm:inline">Add Log</span>
    </>
  )}
</Button>
```

**3. Import `Plus`** from `lucide-react` (add to the existing import line).

### Files to Modify

| File | Change |
|---|---|
| `src/pages/ProjectDetail.tsx` | 1. Add `Plus` to lucide-react import. 2. Hide date text on mobile with `hidden sm:inline`. 3. Replace "Add Log" text with `Plus` icon on mobile using `sm:hidden` / `hidden sm:inline`. |

One file. No logic changes — same handlers, same state, same behavior.

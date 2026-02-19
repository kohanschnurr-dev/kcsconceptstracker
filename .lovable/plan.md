

## Collapse Notes to 2 Lines When Long

### Problem
The Notes section under each vendor can get long and push the card content down. The user wants notes to be truncated to 2 lines by default, with the ability to expand to see everything.

### Change

**`src/components/project/ProjectVendors.tsx`** (lines 396-410)

Replace the current Collapsible + Textarea approach with a two-mode notes display:

1. **Read mode (default)**: Show notes text with `line-clamp-2` (CSS truncation to 2 lines). If the text is longer than 2 lines, show a small "Show more" toggle below.
2. **Edit mode**: Tapping the text or an edit button opens the full Textarea for editing. On blur, save and return to read mode.

This keeps notes visible at a glance (first 2 lines always shown if notes exist) instead of hiding them entirely behind a collapsed section, while preventing long notes from bloating the card.

### Technical Detail

- Add local state tracking which vendor's notes are in "expanded" or "editing" mode
- Default display: `<p className="line-clamp-2 text-sm">` with the notes text
- If notes overflow 2 lines, show a "Show more / Show less" toggle
- Clicking the text opens the Textarea for editing (same onBlur save pattern)
- If notes are empty, show a small "+ Add notes" link that opens the Textarea


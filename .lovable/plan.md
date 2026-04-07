

## Plan: Soften Completed Event Styling on Calendar

### Problem
Completed events currently get `line-through`, `opacity-60`, and a green overlay that makes them hard to read. The user wants completed events to remain fully readable while still indicating completion.

### Changes

**File: `src/components/calendar/DealCard.tsx`**

Replace the current completed styling with a subtle indicator that preserves readability:

- **Remove** `line-through` and `opacity-60` from task titles
- **Remove** the green background override — keep the original category color so the card looks normal
- **Add** a small green checkmark icon (already present) as the sole completion indicator
- **Keep** the `CheckCircle2` icon next to the title in compact mode and in the icon badge for expanded mode
- In compact mode: keep original category colors, just prepend the green check icon
- In expanded mode: keep original card styling, just swap the category icon for a green check and show "Completed" badge alongside the category badge

Essentially: the card looks exactly like a normal event, but with a small green checkmark added. No color changes, no strikethrough, no opacity reduction.

### Files
- `src/components/calendar/DealCard.tsx`


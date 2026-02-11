

## Show Event Title as Read-Only by Default

Currently, the event side panel title is always an editable `Input` field, so it appears selected/editable the moment you open an event. The fix is to make the title display as plain text by default, and only switch to an editable input when the user clicks on it (or clicks an edit icon).

### Changes

**File: `src/components/calendar/TaskDetailPanel.tsx`**

1. Add a new `isEditingTitle` state (default `false`), reset to `false` when `task` changes (in the existing `useEffect`).

2. Replace the always-visible `Input` (lines 325-330) with conditional rendering:
   - **When not editing**: Show the title as a styled `h2`/`span` with a click handler that sets `isEditingTitle = true`.
   - **When editing**: Show the current `Input` with `autoFocus`, and on blur (or Enter key), set `isEditingTitle = false`.

3. No other files affected.

### Technical Detail

```
// New state
const [isEditingTitle, setIsEditingTitle] = useState(false);

// Reset on task change (add to existing useEffect)
setIsEditingTitle(false);

// In JSX, replace the Input with:
{isEditingTitle ? (
  <Input
    value={editedTitle}
    onChange={(e) => handleTitleChange(e.target.value)}
    onBlur={() => setIsEditingTitle(false)}
    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
    autoFocus
    className="text-xl font-semibold ..."
    placeholder="Event title..."
  />
) : (
  <h2
    className="text-xl font-semibold cursor-pointer hover:text-primary ..."
    onClick={() => setIsEditingTitle(true)}
  >
    {editedTitle || 'Untitled Event'}
  </h2>
)}
```

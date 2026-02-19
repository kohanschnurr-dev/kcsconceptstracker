

## Add Selectable Checklist Presets for Calendar Events

### Problem
Currently, adding checklist items to a calendar event requires typing each one manually into a text input. This is tedious on mobile -- users have to tap into the field, type, and hit the + button for every item.

### Solution
Add a preset checklist system where tapping a category auto-suggests relevant checklist items as tappable chips/buttons. Users tap to add, tap again to remove. They can still type custom items too.

### Changes

**1. `src/lib/calendarCategories.ts`** -- Add checklist presets map

Add a new exported constant `CATEGORY_CHECKLIST_PRESETS` that maps category values to suggested checklist items. Examples:

| Category | Preset Items |
|---|---|
| demo | Dumpster ordered, Utilities disconnected, Permits pulled, Hazmat check, Demo complete walkthrough |
| roofing | Materials delivered, Tear-off complete, Underlayment, Shingles installed, Gutters, Final inspection |
| plumbing_rough | Water lines, Drain lines, Gas lines, Pressure test, Stub-outs |
| electrical_rough | Panel installed, Wiring run, Boxes set, Low voltage, Label circuits |
| drywall | Hang, Tape/bed, Texture, Touch-up |
| painting | Prime, First coat, Second coat, Touch-up, Trim/doors |
| tile | Layout, Set tile, Grout, Seal |
| flooring | Acclimate, Underlayment, Install, Transitions, Final clean |
| permitting | Application submitted, Plans approved, Permit posted, Inspections scheduled |
| closing | Title clear, Funding confirmed, Docs signed, Keys received |
| stage_clean | Deep clean, Stage furniture, Photos scheduled, Listing prep |
| And more for each category... |

**2. `src/components/calendar/TaskDetailPanel.tsx`** -- Add preset chips UI

Below the "Add a task..." input (around line 487), add a section that shows preset items for the current category as tappable chips:

- Show only presets that are NOT already in the checklist (to avoid duplicates)
- Each chip is a small outlined button with a + icon
- Tapping a chip instantly adds it to the checklist (no typing needed)
- Section has a label like "Quick add:" and wraps horizontally
- If all presets are already added, hide the section

**3. `src/components/calendar/NewEventModal.tsx`** -- Add checklist section to creation flow

Currently the new event modal has no checklist at all -- users can only add checklist items after creating the event. Add a checklist section to the creation form (before Notes) with:

- Same preset chips based on selected category
- Same manual input for custom items
- Checklist gets saved with the event on creation

This means users can set up their checklist during event creation instead of having to open the event detail after.

### Technical Detail

The preset data structure in `calendarCategories.ts`:
```
export const CATEGORY_CHECKLIST_PRESETS: Record<string, string[]> = {
  demo: ['Dumpster ordered', 'Utilities disconnected', ...],
  roofing: ['Materials delivered', 'Tear-off complete', ...],
  // ... one entry per category
};
```

The chip component pattern (in both TaskDetailPanel and NewEventModal):
```
{availablePresets.map(preset => (
  <button onClick={() => addPresetItem(preset)} 
    className="text-xs px-2 py-1 rounded-full border ...">
    + {preset}
  </button>
))}
```

The NewEventModal will need new state for `checklist` array and include it in the insert payload on `handleSubmit`.

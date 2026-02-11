

## State Field: Autocomplete/Combobox with All US States

### What Changes
Replace the plain text input for "State" on the Settings page with a searchable combobox (type-to-filter) that lists all 50 US states plus DC. The user can type to narrow results and select from the dropdown.

### Implementation

**File: `src/pages/Settings.tsx`**

1. Add a constant array of all US states with their abbreviations (e.g., `{ label: "Texas", value: "TX" }`) -- 51 entries (50 states + DC)
2. Replace the State `<Input>` with a `Popover` + `Command` (cmdk) combobox pattern already available in the project via `src/components/ui/command.tsx` and `src/components/ui/popover.tsx`
3. The combobox will:
   - Show the currently selected state abbreviation (or "Select state..." placeholder)
   - Open a searchable dropdown on click
   - Filter states as the user types
   - Set the state value on selection and close the popover
4. The stored value remains the two-letter abbreviation (e.g., "TX") for consistency with the weather geocoding logic

### UI Behavior
- Trigger button styled to match existing inputs (same height, border, font size)
- Dropdown shows state name + abbreviation (e.g., "Texas (TX)")
- Typing filters the list in real-time
- Selecting a state closes the dropdown and updates the value
- A `ChevronsUpDown` icon on the right indicates it's a dropdown
- A checkmark appears next to the currently selected state


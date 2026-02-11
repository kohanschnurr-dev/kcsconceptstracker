

## Make Project Name and Address Editable Inline

### What Changes

The project name and address on the project detail page header will become click-to-edit fields. Clicking on either will turn it into a text input; pressing Enter or clicking away saves the change to the database. The status dropdown and start date picker are already editable.

### How It Works

- Click the project name to edit it inline -- it becomes a text input
- Click the address to edit it inline -- same behavior
- Press Enter or click away (blur) to save
- Press Escape to cancel without saving
- Empty values are rejected (name and address are required)

### Technical Details

**File: `src/pages/ProjectDetail.tsx`**

1. Add two new state variables:
   - `editingName: boolean` (default false)
   - `editingAddress: boolean` (default false)

2. Replace the static `<h1>{project.name}</h1>` (line 414) with a conditional:
   - When `editingName` is false: render the name in an `<h1>` with `cursor-pointer hover:text-primary` and `onClick` to enable editing
   - When `editingName` is true: render an `<Input>` pre-filled with the name, auto-focused, that saves on blur/Enter and cancels on Escape

3. Replace the static address `<span>{project.address}</span>` (lines 471-474) with the same pattern:
   - Click to toggle `editingAddress`
   - Show an `<Input>` when editing, save on blur/Enter

4. Both save handlers will:
   - Trim the value and reject empty strings
   - Call `supabase.from('projects').update(...)` 
   - Update local `project` state on success
   - Show a toast on error

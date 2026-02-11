

## Add 3-Dot Menu to Project Cards for Quick Editing

### What Changes

A small 3-dot (ellipsis) menu button will appear in the bottom-right corner of each project card on the dashboard. Clicking it opens a dropdown with options to edit the project name, address, budget, status, and start date -- all inline without navigating away.

### How It Works

- A subtle "..." button sits in the bottom-right corner of each card
- Clicking it opens a dropdown menu with options: Edit Name, Edit Address, Change Status, and Delete Project
- Selecting "Edit Name" or "Edit Address" replaces the respective text with an inline input field (same pattern as the ProjectDetail page)
- "Change Status" opens a sub-menu with Active / On Hold / Complete options
- Changes save to the database immediately
- The card data refreshes after any edit
- Clicking the 3-dot button stops event propagation so it doesn't navigate to the project

### Technical Details

**File: `src/components/dashboard/ProjectCard.tsx`**

1. Add state for `editingName`, `editingAddress`
2. Add a `DropdownMenu` (from radix) with a `MoreVertical` trigger button positioned absolutely in the bottom-right
3. Menu items: "Edit Name", "Edit Address", "Change Status" (submenu with 3 options), separator, "Delete" (with confirmation)
4. When "Edit Name" is selected, replace the `<h3>` with an `<Input>`, auto-focus, save on blur/Enter, cancel on Escape
5. Same pattern for address
6. Status change calls `supabase.from('projects').update({ status })` directly

**Props changes:**
- Add `onProjectUpdated?: () => void` callback prop to trigger data refresh in the parent
- Both `Index.tsx` and `Projects.tsx` pass `fetchData` as `onProjectUpdated`

**File: `src/pages/Index.tsx`**
- Pass `onProjectUpdated={fetchData}` to each `ProjectCard`

**File: `src/pages/Projects.tsx`**
- Pass `onProjectUpdated={fetchProjects}` to each `ProjectCard`

**New imports in ProjectCard:**
- `MoreVertical` from lucide-react
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuSeparator` from radix
- `Input` from ui
- `useState`, `useRef`, `useEffect` from React
- `useToast` from hooks


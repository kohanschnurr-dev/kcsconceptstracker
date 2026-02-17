

## Add Tab Visibility Toggles to Project Type Tabs

### What This Does
Adds an eye icon toggle next to each project type in the "Tab Order" settings popover, letting you hide tabs you don't use (e.g., if you never do New Builds). At least one tab must remain visible.

### How It Works
- Each tab row in the reorder popover gets a visibility toggle (eye/eye-off icon)
- Hidden tabs disappear from the main tab bar
- The active tab auto-switches if the currently selected tab gets hidden
- Preference is saved to your profile so it persists across devices

### Technical Details

**Database Migration** -- Add a `hidden_project_tabs` JSONB column to the `profiles` table (default `[]`).

**`src/hooks/useProfile.ts`**
- Add `hiddenProjectTabs` derived from `profile?.hidden_project_tabs` (defaults to `[]`)
- Add `updateHiddenTabs` mutation to persist the array

**`src/pages/Projects.tsx`**
- Filter `tabOrder` by `hiddenProjectTabs` to get `visibleTabs`
- Use `visibleTabs` for rendering the `TabsList` and `TabsContent`
- Default `mainTab` to first visible tab
- In the reorder popover, add an eye toggle button per row
- Enforce at least 1 tab must remain visible (disable toggle on last visible tab)

**Popover UI Change** -- Each row gets: `[Icon] Label [Eye toggle] [Up] [Down]`


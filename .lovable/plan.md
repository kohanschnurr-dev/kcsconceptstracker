

## Internal Project Search & Autocomplete

### What This Does
Adds a smart search-as-you-type autocomplete for selecting projects throughout the app. When typing in a project selection field (or using "@" to trigger lookup), matching projects from your database appear instantly. No external APIs needed - this is purely internal search.

---

### Current Behavior
- Project dropdowns show all projects in a static list
- Must scroll through all projects to find one
- No search/filter capability in selection dropdowns
- Forms like Quick Expense, Calendar Events, etc. use basic Select components

### New Behavior  
- Type a few letters → instantly see matching projects
- Optional "@" trigger: type "@Wales" to search for "Wales Rental"
- Shows project name + address for easy identification
- Keyboard navigation support (arrow keys, enter to select)
- Works everywhere projects are selected

---

### Technical Implementation

#### 1. Create Reusable ProjectAutocomplete Component

**New File: `src/components/ProjectAutocomplete.tsx`**

This component will:
- Use the existing `Command` + `Popover` components for the dropdown
- Accept a list of projects and filter them as user types
- Support "@" trigger: if input starts with "@", treat rest as search query
- Show structured results: **Project Name** + address (secondary text)
- Return selected project to parent component

```typescript
interface ProjectAutocompleteProps {
  projects: Project[];
  value: string;  // Selected project ID
  onSelect: (projectId: string) => void;
  placeholder?: string;
  filterActive?: boolean;  // Only show active projects
  className?: string;
}
```

Key features:
- Debounced search (100ms) for smooth typing
- Fuzzy matching on name and address
- "@" mention support for quick triggering
- Empty state when no matches found
- Proper z-index and solid background for dropdown

#### 2. Component Architecture

```text
┌─────────────────────────────────────────┐
│  ProjectAutocomplete Component          │
│  ┌─────────────────────────────────┐    │
│  │ 🔍 @Wales...                    │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Wales Rental                    │◄───┤ Dropdown
│  │   123 Wales St, Dallas, TX      │    │ (Command)
│  ├─────────────────────────────────┤    │
│  │ Wales Flip Project              │    │
│  │   456 Wales Ave, Plano, TX      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

#### 3. Update Forms to Use ProjectAutocomplete

Replace the standard Select dropdowns in these files:

| File | Usage |
|------|-------|
| `src/components/QuickExpenseModal.tsx` | Quick add expense - project selection |
| `src/components/NewDailyLogModal.tsx` | Daily log - project selection |
| `src/components/calendar/NewEventModal.tsx` | Calendar event - project selection |
| `src/components/calendar/CalendarHeader.tsx` | Calendar filter - project selection |
| `src/components/SmartSplitReceiptUpload.tsx` | Receipt split - project selection |
| `src/components/CreateBudgetModal.tsx` | Budget creation - project selection |

**Example Change (QuickExpenseModal.tsx):**

```tsx
// Before
<Select value={selectedProject} onValueChange={setSelectedProject}>
  <SelectTrigger>
    <SelectValue placeholder="Select project" />
  </SelectTrigger>
  <SelectContent>
    {projects.filter(p => p.status === 'active').map((project) => (
      <SelectItem key={project.id} value={project.id}>
        {project.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// After
<ProjectAutocomplete
  projects={projects}
  value={selectedProject}
  onSelect={setSelectedProject}
  placeholder="Search projects or type @..."
  filterActive={true}
/>
```

---

### Component Implementation Details

The `ProjectAutocomplete` component will:

1. **Input handling**
   - Normal typing: filter projects by name/address
   - "@" prefix: strip "@" and search (e.g., "@Wales" searches for "Wales")
   - Show/hide dropdown based on input focus

2. **Filtering logic**
   - Case-insensitive matching
   - Search both `name` and `address` fields
   - Optional filter to only show active projects

3. **Selection behavior**
   - Click or Enter to select
   - Escape to close dropdown
   - Display selected project name in input after selection

4. **Styling**
   - Solid background (not transparent) for dropdown
   - High z-index to appear above modals
   - Match existing UI patterns (borders, colors, spacing)

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/ProjectAutocomplete.tsx` | Create | Reusable autocomplete component |
| `src/components/QuickExpenseModal.tsx` | Modify | Use ProjectAutocomplete for project selection |
| `src/components/NewDailyLogModal.tsx` | Modify | Use ProjectAutocomplete |
| `src/components/calendar/NewEventModal.tsx` | Modify | Use ProjectAutocomplete |
| `src/components/calendar/CalendarHeader.tsx` | Modify | Use ProjectAutocomplete |
| `src/components/SmartSplitReceiptUpload.tsx` | Modify | Use ProjectAutocomplete |
| `src/components/CreateBudgetModal.tsx` | Modify | Use ProjectAutocomplete |

---

### No External Dependencies

This feature uses only existing project components:
- `Command` (from cmdk library, already installed)
- `Popover` (from radix-ui, already installed)
- No API keys required
- No database changes needed
- Purely client-side filtering

---

### Summary

- Create one reusable `ProjectAutocomplete` component
- Replace 6 project selection dropdowns across the app
- Support "@" mention trigger for quick lookups
- Instant filtering as you type - no external APIs
- Better UX for finding projects quickly


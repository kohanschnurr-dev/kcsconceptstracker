
## Auto-Select Project in Import Tab When Inside a Project

### Problem

When opening "Add Expense > Import CSV" from within a project's Budget page, the modal still shows a project selector dropdown and asks you to pick a project -- even though you're already in one. This is unnecessary friction.

### Root Cause

`ProjectBudget.tsx` already passes only the current project in the `projects` array, but `ImportTab` doesn't take advantage of this. It always starts with `selectedProject = ''` and renders the full selector.

### Fix in `src/components/QuickExpenseModal.tsx`

**1. Auto-select when only one project exists**

In the `ImportTab` component, initialize `selectedProject` to the single project's ID when only one is provided:

```typescript
const [selectedProject, setSelectedProject] = useState(
  projects.length === 1 ? projects[0].id : ''
);
```

**2. Hide the project selector when pre-selected**

Wrap the project selector `<Label>` and `<ProjectAutocomplete>` block in a condition so it only renders when there are multiple projects:

```tsx
{projects.length > 1 && (
  <div className="space-y-2">
    <Label>Project <span className="text-destructive">*</span></Label>
    <ProjectAutocomplete ... />
  </div>
)}
```

**3. Also hide the "Select a project" empty state**

The empty state message ("Select a project above to begin importing expenses") should only appear when there are multiple projects and none is selected yet:

```tsx
{!selectedProject && projects.length > 1 && (
  <div className="text-center py-8 space-y-3">...</div>
)}
```

No changes to styling, colors, or layout. The same logic already exists implicitly for `ExpenseForm` (the Single Expense tab) -- this just brings `ImportTab` in line.

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- auto-select project and hide selector in ImportTab when only one project is available

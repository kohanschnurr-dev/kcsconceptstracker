
## Feature: Project-Specific Custom Fields in Job Details / Property Info

### What the User Wants

The Settings → Manage Sources screen defines a **global template** of fields (e.g., Client Name, Permit #, Scope of Work for contractor jobs). These auto-populate on every project. But sometimes a specific project needs a one-off field — like "Plumbing Type" for a kitchen remodel — that doesn't belong on the global template.

The solution: add a **"+ Add Field"** button at the bottom of the Job Details / Property Info card that lets users add project-specific fields. These extra fields appear only on that one project and are never added to Settings.

---

### Data Storage — No DB Changes Needed

The `project_info` table already has a `custom_fields` JSONB column. Today it stores values from the global custom fields. We'll extend it to also store project-specific field **definitions** (label + key) alongside their values.

We'll use a dedicated key inside `custom_fields` to store these definitions:

```json
{
  "client_name": "John Smith",
  "scope_of_work": "Full kitchen remodel",
  "_project_fields": [
    { "value": "plumbing_type", "label": "Plumbing Type" }
  ]
}
```

The `_project_fields` array holds the metadata for any project-specific fields the user added. Their values are stored as normal keys alongside the rest.

---

### UI Layout (After Change)

```
┌─────────────────────────────────────────────────────┐
│  Job Details                                        │
├─────────────────────────────────────────────────────┤
│  [Global fields from Settings — always shown]       │
│  Client Name: ___________  Client Email: _______    │
│  Contract Type: _________  Permit #: ___________    │
│  ...                                                │
├─────────────────────────────────────────────────────┤
│  ─── Project-Specific Fields ───                    │
│  Plumbing Type: ___________  [✕ remove]             │
│  Tile Material: ___________  [✕ remove]             │
│                                                     │
│  [+ Add Field]                   💾 Auto-saves      │
└─────────────────────────────────────────────────────┘
```

When the user clicks **+ Add Field**:
- An inline form slides in with a "Field label" text input and a "Add" button
- On confirm, the field is immediately added to the grid and auto-saved into `_project_fields` in `custom_fields`
- A small **✕** icon on each project-specific field chip lets the user remove it (and its value) from this project only

---

### Technical Details

#### Changes to `src/components/project/ProjectInfo.tsx`

**1. Load project-specific fields on mount**

When fetching `project_info`, extract `_project_fields` from `custom_fields` and store them in a `projectFields` state array:

```tsx
const [projectFields, setProjectFields] = useState<CategoryItem[]>([]);

// Inside fetchInfo, after getting data:
const rawCustom = (data as any).custom_fields || {};
const projectFieldDefs: CategoryItem[] = rawCustom._project_fields || [];
setProjectFields(projectFieldDefs);
```

**2. Merge for rendering**

The rendered grid stays the same structure — global fields from `activeFields` (Settings), then project-specific fields from `projectFields`, all sharing the same `fields` / `handleBlur` logic since values are all stored in `custom_fields`.

**3. Save project-specific field definition**

When a user adds a new project-specific field, save its definition into `_project_fields` inside `custom_fields` alongside the existing data:

```tsx
const handleAddProjectField = async (label: string) => {
  const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  // Prevent duplicates
  // Merge new field def into _project_fields and persist to DB
  // Then update projectFields state
};
```

**4. Remove project-specific field**

Clicking ✕ on a project-specific field:
- Removes it from `projectFields` state
- Deletes its value from `fields`
- Updates `custom_fields` in DB: removes the key and updates `_project_fields`

**5. Inline "Add Field" UI**

Below the grid, a collapsible inline form:
```tsx
const [addingField, setAddingField] = useState(false);
const [newFieldLabel, setNewFieldLabel] = useState('');

// Rendered below project-specific fields:
{addingField ? (
  <div className="flex items-center gap-2 col-span-full">
    <Input
      placeholder="Field label (e.g. Plumbing Type)"
      value={newFieldLabel}
      onChange={e => setNewFieldLabel(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleAddProjectField(newFieldLabel)}
      autoFocus
    />
    <Button size="sm" onClick={() => handleAddProjectField(newFieldLabel)}>Add</Button>
    <Button size="sm" variant="ghost" onClick={() => setAddingField(false)}>Cancel</Button>
  </div>
) : (
  <Button variant="ghost" size="sm" className="col-span-full w-fit gap-1.5 text-muted-foreground" onClick={() => setAddingField(true)}>
    <Plus className="h-3.5 w-3.5" /> Add Field
  </Button>
)}
```

**6. Divider between global and project-specific fields**

When `projectFields.length > 0` or `addingField` is true, show a subtle labeled divider:
```tsx
{(projectFields.length > 0 || addingField) && (
  <div className="col-span-full flex items-center gap-2 mt-2">
    <div className="h-px flex-1 bg-border" />
    <span className="text-xs text-muted-foreground">Project-Specific</span>
    <div className="h-px flex-1 bg-border" />
  </div>
)}
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/project/ProjectInfo.tsx` | 1. Add `projectFields` state. 2. Load `_project_fields` from `custom_fields` on fetch. 3. `handleAddProjectField` function. 4. `handleRemoveProjectField` function. 5. Render project-specific fields section with divider and remove buttons. 6. Inline "Add Field" form. |

**One file. No DB migrations needed** — `custom_fields` JSONB already supports this.

---

### Edge Cases

- Duplicate label: if user types a label whose generated key already exists (in global OR project fields), show a brief inline error and block the add
- Empty label: "Add" button is disabled when the input is blank
- Removing a global field: not possible from the project page (that's a Settings action) — the ✕ only appears on project-specific fields
- Key collision with `_project_fields`: reserved key, never rendered as a field itself
- Multiline project-specific fields: since user defines the label, we can't know which should be multiline — default to single-line Input; the user can type long text naturally

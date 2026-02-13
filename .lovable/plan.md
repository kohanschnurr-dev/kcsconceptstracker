

## Collapse Role Sections by Default

### Problem
The Manage Roles card shows all permissions for both "Project Manager" and "Viewer" fully expanded, making the settings page very long to scroll through.

### Solution
Wrap each role section in a `Collapsible` component (already available in the project) so they start **collapsed** by default. Users click the role badge to expand and see/edit permissions.

### File Change

**`src/components/settings/ManageRolesCard.tsx`**:

1. Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`
2. Import `ChevronDown` from `lucide-react`
3. Wrap each role's permission grid inside a `Collapsible` with `open` defaulting to `false`
4. Make the role `Badge` the `CollapsibleTrigger`, adding a small chevron icon that rotates when open
5. Move the permissions grid into `CollapsibleContent`

### Visual Result

Collapsed (default):
```
[v] Project Manager
[v] Viewer
```

Expanded (after clicking):
```
[^] Project Manager
  [x] View Projects - Can see project details
  [x] Edit Projects - Can create/edit projects
  ...
[v] Viewer
```

Each role independently toggles open/closed. No other layout changes.


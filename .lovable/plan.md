
## Plan: Remove "Not Assigned" Text from Bundle Views

### Problem
The user doesn't want to see project assignment status in the bundle UI. Currently showing:
- "Not assigned" on bundle cards in the Bundles list
- "Not assigned to a project" in the Bundle Detail header

### Changes

#### 1. Bundles.tsx (Bundle Cards)

**Lines 242-246**: Remove the entire conditional block that shows project name or "Not assigned"

| Before | After |
|--------|-------|
| Shows "→ {projectName}" or "Not assigned" | Show nothing - just the bundle name |

```tsx
// Remove this block entirely:
{bundle.projectName ? (
  <p className="text-sm text-muted-foreground truncate">→ {bundle.projectName}</p>
) : (
  <p className="text-sm text-muted-foreground italic">Not assigned</p>
)}
```

#### 2. BundleDetail.tsx (Bundle Header)

**Lines 297-303**: Remove the conditional block showing project assignment status

| Before | After |
|--------|-------|
| Shows "Assigned to: {project}" or "Not assigned to a project" | Show nothing below the bundle name |

```tsx
// Remove this block entirely:
{project ? (
  <p className="text-muted-foreground">
    Assigned to: <span className="text-foreground">{project.name}</span>
  </p>
) : (
  <p className="text-muted-foreground italic">Not assigned to a project</p>
)}
```

### Result

| Location | Before | After |
|----------|--------|-------|
| Bundle cards | Shows project name or "Not assigned" | Just bundle name and description |
| Bundle detail header | Shows "Assigned to: X" or "Not assigned to a project" | Just bundle name |

### Files Modified
- `src/pages/Bundles.tsx`
- `src/pages/BundleDetail.tsx`

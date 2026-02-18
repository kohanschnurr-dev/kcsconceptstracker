
## Add Persistent HardHat Icon for Contractor Projects

### Problem
`ProjectCard` renders project-type icons with a simple if/else chain. The contractor type (`project.projectType === 'contractor'`) has no explicit branch, so it falls through to the catch-all `else` and displays a `Hammer` icon — the same as fix-and-flip. Contractor projects should always show the `HardHat` icon, which is already the established icon for that type in `Projects.tsx` and the new project modal.

### Files to Change

**`src/components/dashboard/ProjectCard.tsx`** — 3 small changes:

1. **Import** `HardHat` alongside the existing lucide imports (line 1)
2. **Add** `isContractor` boolean alongside `isRental`, `isNewConstruction`, `isWholesaling` (line 19)
3. **Insert** the contractor branch in the icon render block (lines 100–108) — before the `isWholesaling` check so the chain reads cleanly:

```tsx
// Line 1 — updated import
import { MapPin, Calendar, Home, Hammer, Building2, Handshake, Star, HardHat } from 'lucide-react';

// Line 19 — new boolean
const isContractor = project.projectType === 'contractor';

// Lines 100–108 — icon render (updated chain)
{isNewConstruction ? (
  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
) : isRental ? (
  <Home className="h-4 w-4 text-muted-foreground shrink-0" />
) : isWholesaling ? (
  <Handshake className="h-4 w-4 text-muted-foreground shrink-0" />
) : isContractor ? (
  <HardHat className="h-4 w-4 text-muted-foreground shrink-0" />
) : (
  <Hammer className="h-4 w-4 text-muted-foreground shrink-0" />
)}
```

No other files need changing — the `HardHat` icon is already used consistently everywhere else for contractor projects (`Projects.tsx` tab, `NewProjectModal`, `FieldTab`).

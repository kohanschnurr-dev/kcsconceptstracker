

## Add Wholesaling Icon to Project Card

### Problem
The `ProjectCard` component's icon logic only checks for `new_construction` and `rental`, defaulting everything else (including `wholesaling`) to the Hammer icon.

### Change

**File: `src/components/dashboard/ProjectCard.tsx`**

1. Add `Handshake` to the lucide-react imports
2. Add a `const isWholesaling = project.projectType === 'wholesaling';` variable (alongside the existing `isRental` and `isNewConstruction`)
3. Update the icon conditional to include wholesaling before the default fallback:

```tsx
{isNewConstruction ? (
  <Building2 className="h-4 w-4 text-muted-foreground" />
) : isRental ? (
  <Home className="h-4 w-4 text-muted-foreground" />
) : isWholesaling ? (
  <Handshake className="h-4 w-4 text-muted-foreground" />
) : (
  <Hammer className="h-4 w-4 text-muted-foreground" />
)}
```

This is a single-file, ~3-line change.

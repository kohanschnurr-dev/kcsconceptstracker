

## Remove Home Icon from Rental Tab

### Change
In `src/components/NewProjectModal.tsx`, remove the `<Home className="h-4 w-4" />` element from the Rental `TabsTrigger` (line 145). The text label "Rental" will remain.

Also clean up the unused `Home` import from lucide-react (line 2) if no other usage exists in the file.

### File: `src/components/NewProjectModal.tsx`
- **Line 145**: Delete `<Home className="h-4 w-4" />`
- **Line 2**: Remove `Home` from the lucide-react import if unused elsewhere


## Plan: Auto-unstar projects on completion

When a project is marked complete, automatically remove its star so completed projects fall to the back of the list (instead of staying pinned to the front via the star sort).

### Changes

**`src/pages/ProjectDetail.tsx` — `handleCompleteWithDate`**
- After successfully updating the project to `status: 'complete'`, also remove its ID from the user's `starredProjects` list.
- Starred projects are stored in `localStorage` under the same key the Projects page reads (`starredProjects`). Update the array in localStorage and dispatch a storage event (or rely on the Projects page re-reading on mount) so the Projects grid reflects the change on next view.

**`src/pages/Projects.tsx` — defensive sort tweak**
- Treat starred-but-complete projects as unstarred for sort purposes, so any historical starred-complete entries also fall to the back without requiring the user to manually unstar them.

### Result
- Marking a project complete immediately demotes it below all active/on-hold projects.
- Existing starred-complete projects (like "2808 Old North Rd") drop to the back automatically.
- The star icon is preserved on the card if the user re-opens the project, but no longer affects ordering once complete.

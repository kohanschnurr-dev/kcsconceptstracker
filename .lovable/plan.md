

## Remove Edit Pencil Button from Dashboard Project Card

### What Changes

Remove the pencil edit button currently visible in the bottom-right corner of each project card on the dashboard/projects page.

### Technical Details

**File: `src/components/dashboard/ProjectCard.tsx`**

1. Remove the entire edit button block (the `absolute bottom-3 right-3` div with the pencil icon) from the JSX
2. Remove the `isEditing` state and all inline editing logic (`nameValue`, `addressValue`, refs, `saveField`, `handleBlur`) since there's no longer a way to trigger editing from the card
3. Remove unused imports: `Pencil`, `Input`, `useRef`, `useEffect`, and the supabase/toast imports used only for saving
4. Remove the `onProjectUpdated` prop since it's no longer needed on this component
5. Clean up the parent files (`Index.tsx`, `Projects.tsx`) by removing `onProjectUpdated={fetchData}` props passed to `ProjectCard`

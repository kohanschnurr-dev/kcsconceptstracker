

## Plan: Allow Switching Project Type Between Fix & Flip and Rental

### Current State
- A "Convert to Rental" option already exists in the ProjectDetail dropdown, but only shows for completed Fix & Flip projects. There's no way to convert back to Fix & Flip, and no way to do it from the Projects list page.

### Changes

**`src/pages/ProjectDetail.tsx`**
1. Remove the restriction that only completed Fix & Flip projects can convert — allow any status
2. Add a "Convert to Fix & Flip" option when the project is currently a Rental (mirror of existing convert-to-rental)
3. Add a `handleConvertToFlip` function that updates `project_type` to `fix_flip`
4. Update the convert dialog to be bidirectional — show appropriate title/description based on current type
5. Keep the confirmation dialog pattern for safety

**`src/components/dashboard/ProjectCard.tsx`** (Projects list page)
- No changes needed here — the card is display-only and conversion is better done from the detail page where users can see the full context

### Result
- From any project's detail page dropdown (under Status), users can switch between Fix & Flip ↔ Rental regardless of project status
- Confirmation dialog explains what will change
- The existing one-way "Convert to Rental" becomes a bidirectional type switcher


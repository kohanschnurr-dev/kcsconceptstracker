

## Add "Stage" Dropdown to Procurement Item Modal

### What's changing
The `phase` field already exists in the database (`procurement_items.phase`) and in the form state, but it's not visible in the modal UI. This change adds a "Stage" dropdown to the modal so users can select a construction phase (Rough-In, Trim Out, Finish, Punch List) for each item.

### Placement
The Stage dropdown will be added between **Source URL** and **Finish / Color**, sitting on the same row as Finish / Color in the 2-column grid layout:

1. Source Store | Source URL
2. **Stage** | Finish / Color
3. Unit Price | Quantity

### Technical Changes

**File: `src/components/procurement/ProcurementItemModal.tsx`**
- Add a Stage `<Select>` dropdown between the Source URL field and the Finish / Color field (around line 1368)
- Uses the existing `PHASES` array (`Rough-In`, `Trim Out`, `Finish`, `Punch List`) already defined in the file
- Binds to the existing `formData.phase` state -- no new state needed
- Include a "None" option so the field is optional
- The phase value already saves to the database via the existing auto-save logic -- no backend changes needed

The phase is stored on the item itself and travels with it when assigned to bundles/projects, so it naturally relates to whichever project the item is associated with.


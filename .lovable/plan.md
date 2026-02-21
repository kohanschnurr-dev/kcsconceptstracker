

## Convert Work Items, Also Included, and Exclusions to Task-Line UI with Camera Upload

### What Changes

The three textarea sections (Work Items, Also Included, Not Included / Exclusions) in the Scope of Work Generator will be replaced with an interactive task-line UI. Each line item becomes its own row with:
- The text of the item displayed as an editable input
- A camera button to upload/capture photos (supports multiple photos per line)
- A delete button to remove the line
- Thumbnail previews of uploaded photos beneath each line
- A "+ Add Item" button at the bottom of each section

Photos will be stored in the existing `task-photos` storage bucket (already public with RLS policies).

### How It Works

Each section manages an array of objects instead of a plain string:

```text
Before: workItems = "Remove old water heater\nInstall new unit"
After:  workItems = [
          { text: "Remove old water heater", photos: ["url1", "url2"] },
          { text: "Install new unit", photos: [] }
        ]
```

Each line item renders as:
```text
[  Remove old water heater          ] [camera icon] [X]
   [thumb1] [thumb2]
[  Install new 50-gallon unit       ] [camera icon] [X]
[+ Add Item]
```

### Technical Details

**New component: `src/components/vendors/WorkItemLines.tsx`**

A reusable component that renders the task-line UI for any of the three sections. Props:
- `items`: array of `{ text: string; photos: string[] }`
- `onChange`: callback when items change
- `placeholder`: placeholder text for new items
- `label`: section label
- `description`: optional helper text

Handles:
- Adding new empty items via "+ Add Item" button
- Editing item text inline via Input
- Deleting items with an X button
- Camera button per line that triggers a hidden file input (accepts `image/*`, `capture="environment"`, `multiple`)
- Uploading photos to `task-photos` bucket in Supabase Storage
- Displaying photo thumbnails with remove capability

**Modified: `src/components/vendors/ScopeOfWorkSheet.tsx`**

1. Replace state for `workItems`, `alsoIncluded`, and `exclusions` from `string` to `Array<{ text: string; photos: string[] }>`, initialized as empty arrays.

2. Replace the three Textarea blocks (lines 299-327) with the new `WorkItemLines` component.

3. Update `handleGenerate` (the PDF generation) to join item texts with newlines (preserving current PDF format). Photos are not included in the PDF since it's text-based -- they serve as visual documentation for the contractor.

4. Update `handleOpenChange` reset logic to clear the new array format.

**No database or storage changes needed** -- the existing `task-photos` bucket is public and has appropriate RLS policies for authenticated uploads.


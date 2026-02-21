

## Add Photo Preview to Task Photo Thumbnails

### Problem
Clicking on a task photo immediately shows the delete overlay -- there's no way to actually view/preview the photo. Users expect clicking a photo to open a larger preview.

### Solution
Update the photo thumbnails in all three locations to support two actions:
- **Click** the photo to open a full-size preview dialog
- **Small delete button** in the corner (instead of full overlay) to remove the photo

Add a lightweight preview state (`previewUrl`) to each component, and render a simple Dialog showing the full image when set.

### Changes

**1. `src/pages/DailyLogs.tsx` -- TaskPhotoUploader (lines 95-125)**
- Add `previewUrl` state
- Change the thumbnail: clicking the image sets `previewUrl`; move the delete button to a small X icon in the top-right corner (visible on hover)
- Add a simple Dialog below that shows the full-size image when `previewUrl` is set

**2. `src/components/project/ProjectTasks.tsx` -- TaskPhotoUploader (lines 56-86)**
- Same changes as above

**3. `src/components/dashboard/AddTaskDialog.tsx` -- inline photo grid (lines 201-216)
- Add `previewUrl` state
- Same thumbnail UI change: click to preview, corner X to delete
- Add preview Dialog

### UI Pattern (all three locations)
```
Before:
  [photo] -- hover shows full black overlay with X to delete

After:
  [photo] -- click opens full-size preview dialog
  [photo] -- hover shows small X button in top-right corner to delete
```

### Preview Dialog (simple, reusable pattern)
```tsx
<Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
  <DialogContent className="max-w-3xl p-2">
    <img src={previewUrl} className="w-full rounded" />
  </DialogContent>
</Dialog>
```

### Files Changed
- `src/pages/DailyLogs.tsx`
- `src/components/project/ProjectTasks.tsx`
- `src/components/dashboard/AddTaskDialog.tsx`


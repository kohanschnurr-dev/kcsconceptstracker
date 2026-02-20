

## Add Camera/Photo Upload to Daily Logs Task Quick-Add and Project Detail Quick-Add Log

### What Changes

Add the same camera button pattern (already working on the dashboard QuickTaskInput) to two more locations:

1. **Daily Logs page task quick-add** (`src/pages/DailyLogs.tsx`) -- the "Add task to today's list" / "Add to master pipeline" input bar
2. **Project Detail logs tab quick-add** (`src/pages/ProjectDetail.tsx`) -- the "Quick Add Log" form for daily logs

### Changes

**`src/pages/DailyLogs.tsx`**

1. Add state: `newTaskPhotoUrls: string[]` and `newTaskUploading: boolean`
2. Add a hidden file input ref (`newTaskFileRef`)
3. Add a Camera button next to the CalendarIcon button in the quick-add form (visible in both daily and master tabs)
4. Upload handler: upload to `task-photos` bucket, collect public URLs
5. Update `handleCreateTask` insert to include `photo_urls: newTaskPhotoUrls`
6. Reset `newTaskPhotoUrls` on submit
7. Add thumbnail preview strip below the form when photos are attached

**`src/pages/ProjectDetail.tsx`**

1. Add state: `quickLogPhotoUrls: string[]` and `quickLogUploading: boolean`
2. Add a hidden file input ref (`quickLogFileRef`)
3. Add a Camera button next to the Calendar date picker button in the Quick Add Log row
4. Upload handler: upload to `project-photos` bucket under `daily-logs/` folder
5. Update `handleQuickLogSubmit` insert to include `photo_urls: quickLogPhotoUrls`
6. Reset `quickLogPhotoUrls` on submit
7. Add thumbnail preview strip below the form row when photos are attached

### Technical Details

- Both use the same pattern as `QuickTaskInput.tsx`: hidden `<input type="file" accept="image/*" capture="environment" multiple>`, a Camera icon Button, upload to storage, thumbnail strip with X-to-remove
- DailyLogs task quick-add uploads to `task-photos` bucket (same as dashboard)
- ProjectDetail log quick-add uploads to `project-photos` bucket under `daily-logs/` folder (same as NewDailyLogModal)
- Camera button styling matches existing calendar buttons: `variant="outline"`, same height classes (`h-11 sm:h-10` for DailyLogs, `size="sm"` for ProjectDetail)
- Thumbnail strip: `flex flex-wrap gap-2 mt-2` with 40x40 rounded thumbnails and hover-X remove
- No database or migration changes needed (buckets and columns already exist)




## Add Camera/Photo Upload Button to Quick Task Input

### What Changes

A small camera icon button will be added next to the calendar button in the "Quick add task..." bar. Tapping it opens a file picker (accepting images), uploads the selected photo(s) to storage, and attaches the URLs to the task when submitted. A thumbnail preview strip appears below the input when photos are attached.

### Changes

**`src/components/dashboard/QuickTaskInput.tsx`**

1. **Add state**: `photoUrls: string[]` and `isUploading: boolean` to track attached photos.

2. **Hidden file input**: Add a hidden `<input type="file" accept="image/*" capture="environment" multiple>` ref. The `capture="environment"` attribute prompts the device camera on mobile.

3. **Camera button**: Place a new `Button` (variant="outline") with a `Camera` icon from lucide-react, positioned immediately before the calendar button. On click, it triggers the hidden file input.

4. **Upload logic**: When files are selected, upload each to the `task-photos` storage bucket via `supabase.storage.from('task-photos').upload(...)`, collect the public URLs, and append them to the `photoUrls` state.

5. **Submit with photos**: Update the `handleSubmit` insert call to include `photo_urls: photoUrls` so photos are saved with the task.

6. **Thumbnail preview**: Below the form row, conditionally render a small strip of image thumbnails (similar to PasteableTextarea) with an X button to remove each. This strip only appears when `photoUrls.length > 0`.

7. **Reset on submit**: Clear `photoUrls` along with `title` and `dueDate` after successful submission.

### Technical Details

- Import `Camera` from `lucide-react` and `useRef` from React
- Use a `ref` for the hidden file input: `const fileInputRef = useRef<HTMLInputElement>(null)`
- Camera button: same styling as the calendar button (`variant="outline"`, same `min-w-[44px] px-2 sm:px-4`)
- Upload path: `task-photos/{timestamp}-{random}.{ext}`
- The `task-photos` bucket should already exist (used by TaskPhotoUploader). If not, a migration will create it.
- The insert payload adds `photo_urls: photoUrls.length > 0 ? photoUrls : []`
- Thumbnail strip: `flex flex-wrap gap-2 mt-2` with 40x40px rounded thumbnails, each with an absolute X button on hover
- The form wrapper changes from just `<form>` to a `<div>` containing the form row + thumbnail strip below


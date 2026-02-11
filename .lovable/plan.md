

## Cover Photo Crop/Position Editor

### What Changes

When you click "Set as Cover" on a photo, a modal will appear showing a preview of how the image will look in the 16:9 card format. You'll be able to drag the image to reposition it within the frame, then confirm. The position offset is saved to the database and applied on the dashboard card.

### How It Works

- Clicking "Set as Cover" opens a new `CoverCropModal` instead of immediately saving
- The modal shows the photo in a 16:9 preview frame (matching the dashboard card)
- You drag the image up/down (and left/right) to position it within the frame
- Clicking "Save" stores both the cover photo path and a `cover_photo_position` (e.g. `"50% 30%"`) in the `projects` table
- The dashboard ProjectCard uses that `object-position` value when rendering the cover

### Technical Details

**1. Database migration**
- Add `cover_photo_position text default '50% 50%'` column to `projects`

**2. New component: `src/components/project/CoverCropModal.tsx`**
- A Dialog showing the image inside a fixed `aspect-video` container with `overflow-hidden`
- The image is rendered larger than the container (e.g. `w-full h-auto min-h-full`) so it can be repositioned
- Mouse/touch drag events update `object-position` in real-time as a preview
- "Save" button calls the parent callback with the chosen position string
- "Cancel" closes without saving

**3. `src/components/project/PhotoGallery.tsx`**
- `setAsCoverPhoto` no longer saves directly -- instead it opens `CoverCropModal` with the selected photo
- On confirm from the modal, save both `cover_photo_path` and `cover_photo_position` to the `projects` table
- Pass `getPhotoUrl` to the modal

**4. `src/types/index.ts`**
- Add `coverPhotoPosition?: string` to the `Project` interface

**5. `src/components/dashboard/ProjectCard.tsx`**
- Apply `style={{ objectPosition: project.coverPhotoPosition || '50% 50%' }}` to the cover `<img>` tag

**6. `src/pages/Index.tsx` and `src/pages/Projects.tsx`**
- Map `cover_photo_position` from the DB query to `coverPhotoPosition` in the Project object

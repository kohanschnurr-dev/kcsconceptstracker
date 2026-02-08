
## Plan: Add Cover Photo Support for Project Dashboard Cards

### Overview
Allow users to assign a cover photo to projects that will display as a hero image on the project cards in the dashboard and projects list. This leverages the existing `project_photos` table and storage bucket.

---

### Database Change

**Add `cover_photo_path` column to `projects` table:**

| Column | Type | Description |
|--------|------|-------------|
| `cover_photo_path` | `text` (nullable) | References a file path in `project-photos` storage bucket |

This links directly to a project photo's file path, allowing efficient lookup without a separate join.

---

### Visual Design

**Project Card with Cover Photo:**
```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│   [Cover Photo - 16:9 aspect ratio, object-cover]  │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 🔨 Wales Rental                           [active] │
│ 📍 5441 Wales Ave.                                  │
│                                                     │
│ Budget Progress                             97.9%   │
│ ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░ │
│ $59,319 spent                       $60,586 total  │
│ ─────────────────────────────────────────────────  │
│ Remaining           Start Date                      │
│ $1,267              📅 Jan 15, 2026                │
└─────────────────────────────────────────────────────┘
```

**Card without cover photo:** Displays as current (no image section).

---

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | MODIFY | Add `coverPhotoPath?: string` to `Project` interface |
| `src/components/dashboard/ProjectCard.tsx` | MODIFY | Display cover photo at top if available |
| `src/pages/Index.tsx` | MODIFY | Fetch and map `cover_photo_path` from projects |
| `src/pages/Projects.tsx` | MODIFY | Fetch and map `cover_photo_path` from projects |
| `src/components/project/PhotoGallery.tsx` | MODIFY | Add "Set as Cover" action to photo context menu |
| Database migration | CREATE | Add `cover_photo_path` column to projects table |

---

### Implementation Details

#### 1. Database Migration

```sql
ALTER TABLE projects 
ADD COLUMN cover_photo_path text;
```

#### 2. Project Type Update (`src/types/index.ts`)

Add to the `Project` interface:
```typescript
export interface Project {
  // ... existing fields
  coverPhotoPath?: string; // Path to cover photo in project-photos bucket
}
```

#### 3. ProjectCard Component (`src/components/dashboard/ProjectCard.tsx`)

- Add logic to display cover photo at the top of the card when `project.coverPhotoPath` exists
- Use `supabase.storage.from('project-photos').getPublicUrl()` to get the URL
- Apply responsive sizing: `aspect-video` (16:9) with `object-cover`
- Rounded corners on top: `rounded-t-lg`
- Fallback: No image section shown (current behavior)

#### 4. Index.tsx and Projects.tsx Data Fetching

When transforming project data, include:
```typescript
coverPhotoPath: p.cover_photo_path || undefined,
```

#### 5. PhotoGallery Enhancement

Add a "Set as Cover" action to each photo:
- New button/menu item on photo thumbnails or in the preview modal
- Calls: 
  ```typescript
  await supabase.from('projects')
    .update({ cover_photo_path: photo.file_path })
    .eq('id', projectId);
  ```
- Shows toast confirmation: "Cover photo updated"
- Optionally highlight the current cover photo with a badge

---

### User Flow

1. **Navigate** to a project's Photos tab
2. **Upload** photos (if none exist)
3. **Click** on a photo to open preview, or right-click for context menu
4. **Select** "Set as Cover Photo" option
5. **Return** to Dashboard → See the project card now displays the cover image

---

### Technical Notes

- Reuses existing `project-photos` storage bucket (already public)
- No new storage buckets or RLS policies needed
- Cover photo updates instantly via existing storage CDN
- If the cover photo is deleted from the gallery, the card gracefully falls back to no image

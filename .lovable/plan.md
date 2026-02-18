
## Remove "General" Photo Category

### What's Happening

There are two files where `'general'` appears as a photo category:

1. **`src/components/project/PhotoGallery.tsx`** — `PHOTO_CATEGORIES` array (line 33) used for the filter dropdown. Removing it means the filter will only show: All, Before, During, After.
2. **`src/components/project/PhotoUploadModal.tsx`** — `PHOTO_CATEGORIES` array (line 34) used in the upload form dropdown. Also, `globalCategory` state defaults to `'general'` (lines 39, 188, 202) — this needs to be changed to `'before'` so newly uploaded photos default to "Before" instead of the now-removed "General".

### Changes

| File | Line | Change |
|---|---|---|
| `src/components/project/PhotoGallery.tsx` | 33 | Delete the `{ value: 'general', label: 'General' }` entry |
| `src/components/project/PhotoUploadModal.tsx` | 34 | Delete the `{ value: 'general', label: 'General' }` entry |
| `src/components/project/PhotoUploadModal.tsx` | 39 | `useState('general')` → `useState('before')` |
| `src/components/project/PhotoUploadModal.tsx` | 188 | `setGlobalCategory('general')` → `setGlobalCategory('before')` |
| `src/components/project/PhotoUploadModal.tsx` | 202 | `setGlobalCategory('general')` → `setGlobalCategory('before')` |

That's 5 small line edits across 2 files. No logic changes, no DB changes. Any photos already tagged `'general'` in the database will still display (they'll show in the "All" filter) but won't be filterable by that removed category — which is acceptable since no new photos can be tagged as general going forward.

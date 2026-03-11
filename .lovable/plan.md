

## Plan: Multi-Folder Assignment for Contractors

### Problem
Currently a contractor can only belong to one folder (`folder_id` column on `vendors` table). Users need contractors in multiple folders (e.g., "Fix & Flips" and "New Builds").

### Approach
Create a junction table `vendor_folder_assignments` for the many-to-many relationship, then update all frontend code to use it.

### Database Changes

**Migration: Create junction table + clean up**
```sql
-- Junction table
CREATE TABLE public.vendor_folder_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.vendor_folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, folder_id)
);

ALTER TABLE public.vendor_folder_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vendor folder assignments"
  ON public.vendor_folder_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_folder_assignments.vendor_id AND v.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_folder_assignments.vendor_id AND v.user_id = auth.uid()));

-- Migrate existing data
INSERT INTO public.vendor_folder_assignments (vendor_id, folder_id)
SELECT id, folder_id FROM public.vendors WHERE folder_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Drop old column
ALTER TABLE public.vendors DROP COLUMN folder_id;
```

### Frontend Changes

**`src/pages/Vendors.tsx`** (main changes):
- Change `Vendor` interface: replace `folder_id: string | null` with `folder_ids: string[]`
- `fetchVendors`: After fetching vendors, also fetch `vendor_folder_assignments` and merge `folder_ids` onto each vendor
- `handleMoveToFolder`: Toggle — if already assigned, remove the row; if not, insert. No longer a simple update
- `handleDeleteFolder`: Delete assignments via the junction table instead of nulling `folder_id`
- `getFolderVendorCount`: Count vendors where `folder_ids` includes the folder
- Filtering: `vendor.folder_ids.includes(activeFolderId)` instead of `vendor.folder_id === activeFolderId`
- Vendor card: Show multiple folder badges instead of one; left border uses first folder's color
- Dropdown "Move to Folder" → becomes a checklist with checkmarks for assigned folders, clicking toggles

**`src/components/NewVendorModal.tsx`**:
- Change `folderId` state from `string | null` to `string[]`
- Folder selector becomes multi-select with checkboxes
- On submit: after creating/updating the vendor, upsert/delete rows in `vendor_folder_assignments`
- Props: `vendor.folder_ids` instead of `vendor.folder_id`

### Result
Contractors can appear in multiple folders simultaneously. The folder pills show correct counts, filtering works, and vendor cards display all assigned folder badges.




## Plan: Add Color-Coded Folder Organization to Contractors Page

Add a folder system to the Contractors page so users can group contractors into folders (e.g., by city). Folders appear as color-coded cards above the contractor grid. Clicking a folder filters to show only its contractors. Contractors can be assigned to a folder via the edit modal.

### Database Changes

**New table: `vendor_folders`**
```sql
CREATE TABLE public.vendor_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#f59e0b',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.vendor_folders ENABLE ROW LEVEL SECURITY;
-- RLS: users see only their own folders
CREATE POLICY "Users manage own vendor folders" ON public.vendor_folders
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

**Add `folder_id` column to `vendors`**
```sql
ALTER TABLE public.vendors ADD COLUMN folder_id uuid REFERENCES public.vendor_folders(id) ON SET NULL;
```

### Frontend Changes

**`src/pages/Vendors.tsx`**
- Fetch `vendor_folders` on mount
- Render a row of color-coded folder cards above the contractor grid (folder icon with colored accent, name, contractor count)
- Add "Create Folder" button in the folder row
- Clicking a folder sets an `activeFolderId` filter; clicking again or a breadcrumb clears it
- Add "Move to Folder" option in each contractor's dropdown menu (submenu listing available folders + "Remove from folder")

**`src/components/vendors/CreateVendorFolderModal.tsx`** (new)
- Simple modal: folder name + color picker (6-8 preset colors)
- Creates row in `vendor_folders`

**`src/components/NewVendorModal.tsx`**
- Add optional "Folder" dropdown so contractors can be assigned to a folder on create/edit

### UI Layout
```text
┌─────────────────────────────────────────────────┐
│  Contractors                    [Generate] [Add] │
│  ─────────────────────────────────────────────── │
│  [+ Folder] [🟡 Dallas (4)] [🔵 Fort Worth (2)] │
│  ─────────────────────────────────────────────── │
│  [Search...] [All Types ▼]                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Vendor 1 │ │ Vendor 2 │ │ Vendor 3 │         │
│  └──────────┘ └──────────┘ └──────────┘         │
└─────────────────────────────────────────────────┘
```

### Preset Colors
Amber, Blue, Green, Red, Purple, Teal, Pink, Orange — rendered as small colored circles in the create modal.


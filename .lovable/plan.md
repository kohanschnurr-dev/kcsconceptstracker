
## Fix: Nuke All Broken company-logos INSERT Policies and Replace Them Correctly

### What Is Actually Wrong (Definitive)

The database query reveals **two conflicting broken INSERT policies** on the `company-logos` bucket:

- `"Users can upload their own logo"` — WITH CHECK using `foldername(name)[1]` → BROKEN
- `"Users can upload their own company logo"` — WITH CHECK using `foldername(name)[1]` → ALSO BROKEN

The previous migration dropped and re-created the first one, but the second one (`"Users can upload their own company logo"`) was left in place and is still blocking. `storage.foldername(name)[1]` does not work reliably during INSERT — Postgres evaluates the `WITH CHECK` before the row (and thus `name`) is finalized, so the condition always fails silently.

Every other working bucket in this project (`expense-receipts`, `project-documents`, `project-photos`, `bundle-covers`) uses the correct pattern:

```sql
WITH CHECK (bucket_id = 'X' AND auth.role() = 'authenticated')
```

There are also **duplicate UPDATE and DELETE policies** (`"Users can update their own logo"` AND `"Users can update their own company logo"`) that need cleaning up.

**`logo_url` in `company_settings` is `null`** — confirmed. The bucket has zero files. Nothing has ever successfully uploaded.

### The Fix — One Migration Only

Drop **every** existing policy for `company-logos` (all duplicates and broken ones) and replace with four clean policies using the correct authenticated pattern:

```sql
-- Drop all existing company-logos policies (both duplicates)
DROP POLICY IF EXISTS "Users can upload their own logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own company logo" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Company logos are publicly accessible" ON storage.objects;

-- Re-create clean, correct policies
CREATE POLICY "company_logos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "company_logos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "company_logos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "company_logos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');
```

### No Code Changes Needed

- `useCompanySettings.ts` — upload logic is correct
- `Settings.tsx` — error handling is correct
- `pdfExport.ts` — logo rendering is correct (shows logo when `logoUrl` is truthy, emoji fallback otherwise)

### After the Fix

1. Go to Settings → upload your KCS Concepts logo → "Logo uploaded successfully" toast appears
2. Generate any PDF (Invoice, Receipt, Scope of Work)
3. Logo appears in the top-right of the colored header bar

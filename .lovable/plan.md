
## Fix: Company Logo Not Appearing in PDFs

### Root Cause (Confirmed)

Querying the database directly shows `logo_url` is `null` for the KCS Concepts account — the logo was never saved. This means the upload to the `company-logos` storage bucket is **silently failing**. The `handleLogoUpload` function catches the error and shows a toast, but since `logo_url` remains null, `pdfExport.ts` falls back to the emoji icon every time.

The most likely cause is that the storage bucket or its RLS policies are not properly set up in the live environment, causing the upload to fail. The code logic in both the Settings page and `pdfExport.ts` is otherwise correct.

### Two-Part Fix

#### Part 1 — Guarantee the storage bucket exists (database migration)

Re-run the bucket creation with `ON CONFLICT DO NOTHING` so it's idempotent, and re-apply storage RLS policies cleanly. This ensures the bucket is definitely there and writable by the authenticated user.

#### Part 2 — Add a hardcoded fallback logo path in Settings + surface upload errors better

Since the user has `src/assets/kcs-logo.png` already in the project, we can:

- In `Settings.tsx`: improve error logging in `handleLogoUpload` so the actual Supabase error message appears in the toast (not just "Failed to upload logo")
- In `src/hooks/useCompanySettings.ts`: add a `console.error` that logs the full error object from `uploadLogo`
- In `src/lib/pdfExport.ts`: keep existing logic (it's correct — shows logo when `logoUrl` is truthy)

#### Part 3 — Add a "test" indicator in Settings to confirm logo URL is saved

Show the actual saved logo URL as a small debug hint below the logo uploader (just in dev/when null) so the user can immediately confirm if the save succeeded. Once working, this acts as visual confirmation.

### Files to Change

- `src/hooks/useCompanySettings.ts` — better error surfacing from storage upload
- `src/pages/Settings.tsx` — show actual error in toast, add visual confirmation the URL was saved

### What Will Happen After the Fix

1. Upload a logo in Settings → toast shows the real error if it fails, or "Logo uploaded successfully" if it works
2. The saved URL is immediately visible in the Settings logo preview (already works via `logoUrl` from the hook)
3. Generate any PDF → logo appears in the top-right header

### Technical Details

The `uploadLogo` function in `useCompanySettings.ts` currently does:
```typescript
const { error: uploadError } = await supabase.storage
  .from('company-logos')
  .upload(filePath, file, { upsert: true });
if (uploadError) throw uploadError;
```

This throws correctly, but `Settings.tsx` catches it as:
```typescript
} catch (error) {
  console.error('Logo upload error:', error);
  toast.error('Failed to upload logo');
}
```

The `error` object from Supabase storage contains a `.message` property with the actual reason (e.g. "Bucket not found", "new row violates row-level security policy"). We need to show `error.message` in the toast so the user sees — and we see — the real failure reason.

**`Settings.tsx` change:**
```typescript
} catch (error: any) {
  console.error('Logo upload error:', error);
  toast.error(error?.message || 'Failed to upload logo');
}
```

**`useCompanySettings.ts` change:**
```typescript
const uploadLogo = async (file: File): Promise<string> => {
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/logo.${fileExt}`;

  // Remove previous version first (ignore errors)
  await supabase.storage.from('company-logos').remove([filePath]);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('company-logos')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Storage upload failed:', uploadError);
    throw new Error(uploadError.message);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('company-logos')
    .getPublicUrl(filePath);

  return publicUrl;
};
```

This way, when the user tries to upload again, the exact failure reason will appear in the toast, making it immediately debuggable.

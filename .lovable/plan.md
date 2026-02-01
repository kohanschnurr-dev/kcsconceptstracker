

## Plan: Add Unified Save Button for Settings

### Current Behavior
The settings page currently shows individual "Save" buttons that only appear when changes are detected:
- "Save Company Name" button appears when company name changes
- "Save Changes" button appears when first/last name changes

### Proposed Change
Add a unified "Save Settings" button that is always visible and saves all pending changes across both Company Branding and Account sections at once.

### Implementation

**File: `src/pages/Settings.tsx`**

1. **Add a combined save handler function**
   - Create `handleSaveAll` that saves both company settings and profile changes if any exist
   - Show a single success toast when complete

2. **Add a sticky/fixed save button at the bottom of the page**
   - Always visible when there are any unsaved changes
   - Show "Save Settings" button with loading state
   - Displays which sections have pending changes

3. **Keep the inline save buttons as secondary option (optional)**
   - Users can still save individual sections if they prefer

### Changes Summary

| Area | Change |
|------|--------|
| New handler | `handleSaveAll()` - saves company name and profile in one action |
| New UI | Sticky save bar at bottom when changes exist |
| Detection | Combined `hasAnyChanges` variable checking both sections |
| Feedback | Single toast confirming all settings saved |

### Code Structure

```typescript
// Combined change detection
const hasAnyChanges = hasProfileChanges || hasCompanyChanges;

// Combined save handler
const handleSaveAll = async () => {
  try {
    const promises = [];
    if (hasCompanyChanges) {
      promises.push(updateSettings.mutateAsync({ companyName }));
    }
    if (hasProfileChanges) {
      promises.push(updateProfile.mutateAsync({ firstName, lastName }));
    }
    await Promise.all(promises);
    toast.success('Settings saved successfully');
  } catch (error) {
    toast.error('Failed to save settings');
  }
};

// Sticky save bar at bottom of page (inside MainLayout, after the grid)
{hasAnyChanges && (
  <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end">
    <Button onClick={handleSaveAll} disabled={isSaving}>
      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      Save Settings
    </Button>
  </div>
)}
```


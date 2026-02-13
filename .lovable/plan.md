

## Add Dashboard Profit Filter Setting

### What It Does
Adds a new setting in Settings that lets you choose which project types and statuses are included in the **Profit Potential** stat card on the Dashboard. For example, you could show only Fix & Flips, or Fix & Flips + Wholesaling, etc.

### Where It Lives
A new "Dashboard Preferences" card on the Settings page, placed before the Legal section. It contains multi-select checkboxes for:

**Project Types to include in Profit Potential:**
- Fix & Flip (checked by default)
- Rental
- New Construction
- Wholesaling

**Project Statuses:**
- Active (checked by default)
- Completed

### How It Works
- The selected filters are stored in localStorage under a key like `dashboard-profit-filters` and synced across devices via the existing settings sync system.
- The Dashboard reads these filters and applies them when calculating the Profit Potential stat card values.
- If no setting exists, it defaults to current behavior (active projects only, all types).

### File Changes

**`src/hooks/useSettingsSync.ts`**
- Add `'dashboard-profit-filters'` to the `SETTINGS_KEYS` array so it syncs across devices.

**`src/pages/Settings.tsx`**
- Add a new "Dashboard Preferences" card with checkbox toggles for each project type and status.
- Read/write from localStorage key `dashboard-profit-filters` (JSON object: `{ statuses: string[], types: string[] }`).
- Call `triggerSettingsSync()` on change.

**`src/pages/Index.tsx`**
- Read the `dashboard-profit-filters` setting from localStorage on mount.
- Filter the projects used for the Profit Potential calculation based on the saved statuses and types.
- Update the subtitle to reflect the filtered count.

### Settings UI Layout

```text
Dashboard Preferences
Configure which projects appear in your dashboard profit stats.

Profit Potential - Project Types:
[x] Fix & Flip    [x] Wholesaling
[ ] Rental        [ ] New Construction

Profit Potential - Status:
[x] Active        [ ] Completed
```

Checkboxes use the existing Checkbox component. Changes save to localStorage immediately and trigger the settings sync.


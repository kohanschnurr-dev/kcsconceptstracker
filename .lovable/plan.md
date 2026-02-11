

## Customizable Property Info Fields via Manage Sources

### What Changes

You'll be able to add, remove, and reset the Property Info fields that appear on each project's Info tab -- all from **Settings > Manage Sources**. Custom fields beyond the built-in 11 will be stored in a new `custom_fields` JSON column in the database.

### How It Works

- The 11 existing fields (Foundation Status, Roof Year, etc.) are the defaults
- You can remove fields you don't need, add new custom ones (e.g. "Lot Size", "Sewer Type"), and reset to defaults at any time
- Built-in fields save to their dedicated database columns as before
- Custom-added fields save to a new `custom_fields` JSONB column on the same `project_info` table

### Technical Details

**1. Database migration**
- Add `custom_fields jsonb default '{}' not null` column to `project_info`

**2. `src/hooks/useCustomCategories.ts`**
- Add `'propertyInfo'` to the `CategoryType` union
- Add `propertyInfo: 'custom-property-info-fields'` to `STORAGE_KEYS`

**3. `src/components/project/ProjectInfo.tsx`**
- Export the default fields list as `DEFAULT_PROPERTY_FIELDS`
- Replace hardcoded `FIELD_CONFIG` with dynamic list from `getCustomItems('propertyInfo', DEFAULT_PROPERTY_FIELDS)`
- Change `InfoFields` from a fixed interface to `Record<string, string>`
- On load: read both dedicated columns and `custom_fields` JSONB
- On blur/save: write built-in keys to their columns, custom keys to `custom_fields` JSONB

**4. `src/components/settings/ManageSourcesCard.tsx`**
- Import `DEFAULT_PROPERTY_FIELDS` and wire up a new `useCustomCategories('propertyInfo', ...)` hook
- Add a "Property Info Fields" accordion section with the same add/remove/reset pattern as the other sections


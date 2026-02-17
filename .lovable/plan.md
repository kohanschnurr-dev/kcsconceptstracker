

## Fix: Saved Budget Templates Not Reflecting Updated Deal Parameters

### Problem
When you save a budget with updated Deal Parameters (e.g., Purchase Price changed to $200k), the save **does** write correctly to the database. However, the `TemplatePicker` dropdown holds a stale copy of the templates fetched on page load. When you re-select the template from the dropdown, it loads the old cached data instead of the freshly saved values.

### Solution
After a successful save in `BudgetCalculator.tsx`, signal the `TemplatePicker` to refetch its templates from the database so the dropdown always has the latest data.

### Technical Detail

**1. `src/components/budget/TemplatePicker.tsx`**
- Extract the `fetchTemplates` function out of the `useEffect` so it can be called externally.
- Accept a new `refreshKey` prop (a simple counter). Add it as a dependency to the `useEffect` so that incrementing it triggers a refetch.

```tsx
// Props change
interface TemplatePickerProps {
  // ... existing props
  refreshKey?: number;  // NEW
}

// useEffect dependency change
useEffect(() => {
  fetchTemplates();
}, [refreshKey]);
```

**2. `src/pages/BudgetCalculator.tsx`**
- Add a `templateRefreshKey` state counter.
- After a successful save (both insert and update paths, around line 369/375), increment the counter.
- Pass the counter to `TemplatePicker` as the `refreshKey` prop.

```tsx
const [templateRefreshKey, setTemplateRefreshKey] = useState(0);

// After successful save:
setTemplateRefreshKey(prev => prev + 1);

// In JSX:
<TemplatePicker refreshKey={templateRefreshKey} ... />
```

### Files
- **Edit**: `src/components/budget/TemplatePicker.tsx` -- Add `refreshKey` prop, use as useEffect dependency
- **Edit**: `src/pages/BudgetCalculator.tsx` -- Add refresh counter state, increment after save, pass to TemplatePicker


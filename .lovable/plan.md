

## Set a Default Financial Preset

### What Changes
Add the ability to mark one of your financial presets as your **default**. This default preset will auto-populate the Profit Calculator's closing and holding cost fields on any project that doesn't already have custom values saved.

### UI Changes

**`src/components/settings/FinancialPresetsCard.tsx`**
- Add a small star/radio indicator next to each preset row to mark it as the default
- Clicking the star on a preset sets it as the default (and unsets the previous one)
- The currently-default preset gets a subtle "Default" badge or filled star icon
- Store the default preset name in localStorage under a dedicated key (e.g., `profit-calculator-default-preset`) alongside the existing presets data, synced across devices

### Logic Changes

**`src/pages/ProjectDetail.tsx`**
- When passing initial closing/holding values to `ProfitCalculator`, check if the project has saved values (`closing_costs_pct`, etc.)
- If the project has NO saved values (all nullish), look up the user's default preset from localStorage and use its closing/holding percentages as the initial values instead of the hardcoded 6%/3%
- This means new projects automatically get the user's preferred preset without any extra clicks

### Technical Steps

1. **`src/components/settings/FinancialPresetsCard.tsx`**
   - Add a `defaultPreset` state loaded from localStorage key `profit-calculator-default-preset`
   - Add a star/radio button on each preset row; clicking it saves that preset's name as the default
   - The "Standard" preset remains the default if nothing is explicitly chosen
   - Persist via `triggerSettingsSync()` so it syncs across devices

2. **`src/pages/ProjectDetail.tsx`**
   - Import and read both `profit-calculator-presets` and `profit-calculator-default-preset` from localStorage
   - Find the matching preset object
   - Use its values as fallbacks (via `??`) when the project's own columns are null
   - Fallback chain: project saved value -> default preset value -> hardcoded 6%/3%


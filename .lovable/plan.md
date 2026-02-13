
## Financial Presets for Profit Calculator

### What It Does
Adds a "Financial Presets" system to the Profit Calculator on the Financials tab. Users can save and load preset templates for their typical deal assumptions -- closing cost %, holding cost %, and their modes (% vs flat $). This lets users quickly apply known rates (e.g., "My Hard Money Deal" with 6% closing, 3% holding) across projects instead of manually entering the same numbers each time.

### How It Works

**Preset Data Structure** (stored in localStorage, synced via settings sync):
```text
Key: "profit-calculator-presets"
Value: [
  { name: "Default", closingPct: 6, holdingPct: 3, closingMode: "pct", holdingMode: "pct", closingFlat: 0, holdingFlat: 0 },
  { name: "Cash Deal", closingPct: 2, holdingPct: 1, closingMode: "pct", holdingMode: "pct", closingFlat: 0, holdingFlat: 0 },
  ...
]
```

**UI Location**: A small dropdown + save button added to the Profit Calculator header, next to the existing Save button.

### UI Layout

```text
Profit Calculator                    [Preset: v] [+ Save as Preset] [Save]
```

- **Preset Dropdown**: A Select component showing saved presets. Selecting one applies its closing/holding values to the calculator fields.
- **Save as Preset**: Opens a small popover/dialog asking for a name, then saves the current closing/holding config as a new preset.
- **Delete**: Each preset in the dropdown (except the first default) shows a small X to remove it.

### File Changes

**`src/hooks/useSettingsSync.ts`**
- Add `'profit-calculator-presets'` to the `SETTINGS_KEYS` array so presets sync across devices.

**`src/components/project/ProfitCalculator.tsx`**
- Add state for presets list (loaded from localStorage on mount).
- Add a `Select` dropdown in the header to pick a preset, which applies its values to closingPct, holdingPct, closingMode, holdingMode, closingFlat, holdingFlat.
- Add a "Save Preset" button that opens a small Popover with a name input and confirm button. On confirm, saves the current closing/holding config to the presets array in localStorage and triggers settings sync.
- Each preset item in the dropdown shows a delete icon (except built-in defaults).
- Presets only control closing/holding cost fields -- Purchase Price and ARV remain project-specific.

### Default Presets
The system ships with one built-in preset:
- "Standard" -- 6% closing (of ARV), 3% holding (of PP), both in % mode

Users can create unlimited additional presets from their current calculator values.

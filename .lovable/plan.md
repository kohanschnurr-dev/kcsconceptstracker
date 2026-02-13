

## Move Financial Presets to Settings, Simplify Profit Calculator Header

### What Changes

1. **Remove** the Preset dropdown, Save Preset popover, and all preset-related state/logic from `ProfitCalculator.tsx`. The header goes back to just the title and Save button.

2. **Create** a new `src/components/settings/FinancialPresetsCard.tsx` -- an accordion/card section in Settings where users can manage their financial presets (add, edit, delete). Same data structure (`profit-calculator-presets` in localStorage, synced via settings sync), just managed from Settings instead.

3. **Add** the new `FinancialPresetsCard` to `src/pages/Settings.tsx`, placed after the Dashboard Preferences card.

### Technical Details

**`src/components/project/ProfitCalculator.tsx`**:
- Remove imports: `Plus`, `X`, `Select*`, `Popover*`, `triggerSettingsSync`
- Remove: `FinancialPreset` interface, `DEFAULT_PRESETS`, `PRESETS_KEY`, `loadPresets`, `savePresets` functions
- Remove: `presets`, `presetPopoverOpen`, `newPresetName` state and `settings-synced` listener
- Remove: `applyPreset`, `handleSavePreset`, `handleDeletePreset` functions
- Remove: The entire preset Select + Popover block from the header (lines 202-247)
- Keep: All closing/holding cost inputs, modes, and the Save button as-is

**`src/components/settings/FinancialPresetsCard.tsx`** (new file):
- Card with title "Financial Presets" and description about deal assumptions
- List of saved presets, each showing name, closing %, holding %, with edit/delete controls
- "Add Preset" row with name input, closing %, holding % inputs, and mode toggles
- Uses `profit-calculator-presets` localStorage key + `triggerSettingsSync()`
- Ships with one built-in "Standard" preset (6% closing, 3% holding)

**`src/pages/Settings.tsx`**:
- Import and render `FinancialPresetsCard` after `DashboardPreferencesCard`


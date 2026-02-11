

## Stop Auto-Populating "0" in Numeric Inputs

### Problem

When you clear a numeric input field (or add a new preset), it immediately fills in "0", forcing you to select and delete it before typing your actual value.

### What Changes

Update all numeric inputs across the app to show an empty field instead of "0" when there's no meaningful value. This affects two main patterns:

1. **Preset rate inputs** that store numbers and use `|| 0` in the onChange handler (forces 0 immediately)
2. **TemplatePicker tier inputs** with the same `|| 0` pattern

### Technical Details

**File: `src/components/budget/BudgetCanvas.tsx`**
- Line 345: Change `value={preset.pricePerSqft}` to `value={preset.pricePerSqft || ''}` so empty/zero shows blank
- Line 346: Change `parseFloat(e.target.value) || 0` to `parseFloat(e.target.value) || 0` but only on blur/save -- for onChange, store the raw string. Actually, simpler: keep the number storage but display empty when 0.
- Specifically: `value={preset.pricePerSqft || ''}` and keep the onChange as `parseFloat(e.target.value) || 0` -- this way it only shows 0 after you leave the field with nothing typed.

Wait -- the issue is that `|| 0` in onChange immediately sets the value to 0 when you clear, and then the value prop shows "0". The fix:
- Change `updatePresetRate` to accept the raw string and only convert to number, allowing 0 to persist but not auto-fill the UI
- Change `value={preset.pricePerSqft}` to `value={preset.pricePerSqft || ''}` -- when pricePerSqft is 0, show empty

**File: `src/components/budget/TemplatePicker.tsx`**
- Line 355: Change `value={tier.pricePerSqft}` to `value={tier.pricePerSqft || ''}`
- Line 356: Change `parseInt(e.target.value) || 0` to `parseFloat(e.target.value) || 0` (same pattern)

**File: `src/components/budget/BudgetCategoryCard.tsx`**
- Already uses string values and placeholder="0", so this one is fine -- no changes needed

**File: `src/components/project/CashFlowCalculator.tsx`**
- Already uses `value={x || ''}` pattern throughout -- no changes needed

### Summary of edits
Two files, two lines each -- just add `|| ''` to the value prop so zero displays as empty, letting users type freely.

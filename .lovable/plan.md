

## Enlarge Export Reports Dialog and Reduce Card Text Size

### What's Changing

The Export Reports dialog will be made wider and the three export option cards will have their content tightened -- smaller description text and more compact padding -- so they feel spacious but not cramped with words.

### Technical Details

**`src/pages/ProjectBudget.tsx`** (~line 1622)

Widen the dialog from `sm:max-w-2xl` to `sm:max-w-3xl`:

```tsx
<DialogContent className="sm:max-w-3xl">
```

**`src/components/project/ExportReports.tsx`**

1. **Card padding**: Reduce from `p-4` to `p-3` on each option card (lines 278, 295, 312)
2. **Card title text**: Change `font-medium` to `text-sm font-medium` on the title spans (lines 287, 304, 321)
3. **Card icons**: Shrink from `h-5 w-5` to `h-4 w-4` (lines 286, 303, 320)
4. **Description text**: Keep `text-xs` but add `leading-tight` for tighter line spacing (lines 289, 306, 323)
5. **Footer stats text**: Shrink from `text-sm` to `text-xs` (line 330)

### Files Changed
- `src/pages/ProjectBudget.tsx` -- widen dialog to `sm:max-w-3xl`
- `src/components/project/ExportReports.tsx` -- smaller text, icons, and padding in option cards

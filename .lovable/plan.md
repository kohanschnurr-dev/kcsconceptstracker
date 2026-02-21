

## Make Export Reports Dialog Taller

### What's Changing

The Export Reports dialog will expand to use more vertical screen space, making the cards taller and giving the whole dialog more breathing room.

### Technical Details

**`src/pages/ProjectBudget.tsx`** (line 1622)

Add a minimum height to the DialogContent so it claims more vertical space:

```tsx
<DialogContent className="sm:max-w-3xl min-h-[340px]">
```

**`src/components/project/ExportReports.tsx`**

1. Restore outer spacing from `space-y-2` back to `space-y-4` for more vertical room between sections
2. Restore grid gap from `gap-2` back to `gap-3`
3. Add `min-h-[80px]` to each card so they fill more height
4. Restore footer top padding from `pt-2` to `pt-3`

### Files Changed
- `src/pages/ProjectBudget.tsx` -- add `min-h-[340px]` to dialog
- `src/components/project/ExportReports.tsx` -- restore vertical spacing for a taller layout




## Plan: Darken Category Dropdown Highlight

The selected/hovered item in the category command list uses `bg-accent` (line 114 of `src/components/ui/command.tsx`), which is too pale on light backgrounds.

### Change — `src/components/ui/command.tsx`

**Line 114** — Replace the `data-[selected='true']` styles with a darker highlight:

- Change `data-[selected='true']:bg-accent` → `data-[selected='true']:bg-primary/15 dark:data-[selected='true']:bg-accent`
- Change `data-[selected=true]:text-accent-foreground` → `data-[selected=true]:text-foreground dark:data-[selected=true]:text-accent-foreground`

This gives a visible gold-tinted highlight in light mode (using the primary/15 opacity) while keeping the existing dark-mode behavior.

### Files
- `src/components/ui/command.tsx` (single line change)


## Problem

In the loan toolbar, hovering anywhere on the segmented control reveals all three favorite stars at 60% opacity (because they all share the `group-hover/vt:` token). This makes it look like both **Table** and **Cards** are "starred as default" simultaneously — but they're mutually-exclusive views, only one should ever appear active.

The underlying state is fine (`defaultView.viewMode` is a single string), it's purely a visual issue.

## Fix — `src/components/loans/LoanTable.tsx`

Scope the hover-reveal so that an inactive default star only appears when the user hovers **its own button**, not the entire segment. This way:

- The currently-default view shows its filled gold star permanently.
- The other view's star stays invisible until you hover that specific button (a clear "click to set as default" affordance).
- Group is independent and behaves the same.

### Implementation

Add a per-button `group/btn` peer scope on each of the three `<button>` wrappers, then change each `<Star>`'s hover token from `group-hover/vt:opacity-60` → `group-hover/btn:opacity-60`.

```tsx
// Each button gets the per-button hover scope
<button className="group/btn relative h-9 w-9 ...">
  <List className="h-4 w-4" />
  <Star className={cn(
    'absolute -top-1.5 -right-1.5 h-3 w-3 cursor-pointer transition-opacity z-10',
    defaultView.viewMode === 'table'
      ? 'opacity-100 fill-primary text-primary'
      : 'opacity-0 group-hover/btn:opacity-60 hover:!opacity-100 text-muted-foreground',
  )} />
</button>
```

Apply the same change to all three buttons (Table, Cards, Group). The outer `group/vt` token is no longer needed for star reveal, but harmless to leave on the wrapper since nothing else uses it.

## Result

Only one view star (Table OR Cards) is ever visibly filled. The other star stays hidden until that specific button is hovered, eliminating the "both starred" illusion.

## Files Touched

- `src/components/loans/LoanTable.tsx` (3 className edits on buttons + 3 className edits on the Star opacity tokens)

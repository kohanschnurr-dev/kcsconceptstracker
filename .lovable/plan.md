

## Fix Project Dropdown Text Contrast

### Problem
In the `ProjectAutocomplete` dropdown, the address subtitle text uses `text-muted-foreground`, which becomes nearly invisible when:
- An item is highlighted/selected (accent background makes muted text disappear)
- The dark theme's muted foreground doesn't contrast well enough

### Fix

**`src/components/ProjectAutocomplete.tsx`** (line 157):

Change the address text class from:
```
text-xs text-muted-foreground truncate
```
to:
```
text-xs text-muted-foreground truncate data-[selected=true]:text-accent-foreground/70
```

However, since the `data-[selected]` attribute is on the parent `CommandItem`, not the span itself, we need a different approach. Update the span to use a class that inherits proper contrast:

```
text-xs opacity-70 truncate
```

Using `opacity-70` instead of `text-muted-foreground` ensures the address text always maintains relative contrast to its parent's text color — whether the item is in normal state or highlighted/selected state.

### Files to Change
- **`src/components/ProjectAutocomplete.tsx`** — line 157: replace `text-muted-foreground` with `opacity-70` on the address span

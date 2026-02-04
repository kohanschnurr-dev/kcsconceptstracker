

## Plan: Add Type-to-Search for Category Selection

### Overview
Replace the current standard `Select` dropdown for categories with a searchable `Command`+`Popover` component (same pattern as `ProjectAutocomplete`). This allows the user to type to filter categories instead of scrolling through the full list.

---

### Current Behavior
- Category dropdown is a standard Select with grouped options
- User must scroll through all categories to find the one they want
- No search/filter functionality

### New Behavior
- Category selector has a search input at the top
- Typing filters categories in real-time (e.g., typing "dry" shows "Drywall")
- Categories remain grouped by workflow phase
- Color-coded dots and group labels are preserved

---

### UI Preview

```text
┌──────────────────────────────────────┐
│ 🔍 Type to search categories...      │
├──────────────────────────────────────┤
│ Acquisition/Admin (blue)             │
│   ● Due Diligence                    │
│   ● Underwriting                     │
│   ...                                │
│ Structural/Exterior (red)            │
│   ● Demo                             │
│   ● Foundation/Piers                 │
│   ...                                │
└──────────────────────────────────────┘

User types "dry" →

┌──────────────────────────────────────┐
│ 🔍 dry                               │
├──────────────────────────────────────┤
│ Interior Finishes (green)            │
│   ✓ Drywall                          │
└──────────────────────────────────────┘
```

---

### File Changes

| File | Changes |
|------|---------|
| `src/components/calendar/NewEventModal.tsx` | Replace Select with Command+Popover searchable dropdown |

---

### Technical Details

**Key changes to NewEventModal.tsx:**

1. **Add new imports:**
   - `Check`, `ChevronsUpDown` from lucide-react
   - `Command`, `CommandEmpty`, `CommandGroup`, `CommandInput`, `CommandItem`, `CommandList` from ui/command

2. **Add search state:**
   ```typescript
   const [categoryOpen, setCategoryOpen] = useState(false);
   const [categorySearch, setCategorySearch] = useState('');
   ```

3. **Add filter logic:**
   ```typescript
   const filteredCategories = useMemo(() => {
     if (!categorySearch.trim()) {
       return CALENDAR_CATEGORIES;
     }
     const query = categorySearch.toLowerCase().trim();
     return CALENDAR_CATEGORIES.filter(cat =>
       cat.label.toLowerCase().includes(query) ||
       cat.groupLabel.toLowerCase().includes(query)
     );
   }, [categorySearch]);
   
   // Group the filtered categories
   const filteredGrouped = useMemo(() => {
     return filteredCategories.reduce((acc, cat) => {
       if (!acc[cat.group]) acc[cat.group] = [];
       acc[cat.group].push(cat);
       return acc;
     }, {} as Record<CategoryGroup, CalendarCategory[]>);
   }, [filteredCategories]);
   ```

4. **Replace Select with Popover+Command:**
   ```tsx
   <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
     <PopoverTrigger asChild>
       <Button variant="outline" role="combobox" className="...">
         {category ? getCategoryLabel(category) : 'Select category'}
         <ChevronsUpDown className="ml-2 h-4 w-4" />
       </Button>
     </PopoverTrigger>
     <PopoverContent className="... max-h-[300px]">
       <Command shouldFilter={false}>
         <CommandInput
           placeholder="Type to search categories..."
           value={categorySearch}
           onValueChange={setCategorySearch}
         />
         <CommandList>
           <CommandEmpty>No categories found</CommandEmpty>
           {Object.entries(filteredGrouped).map(([groupKey, cats]) => (
             <CommandGroup key={groupKey} heading={CATEGORY_GROUPS[groupKey].label}>
               {cats.map((cat) => (
                 <CommandItem
                   key={cat.value}
                   onSelect={() => {
                     setCategory(cat.value);
                     setCategoryOpen(false);
                     setCategorySearch('');
                   }}
                 >
                   <Check className={cn('mr-2', category === cat.value ? 'opacity-100' : 'opacity-0')} />
                   <span className="w-2 h-2 rounded-full" style={{ ... }} />
                   {cat.label}
                 </CommandItem>
               ))}
             </CommandGroup>
           ))}
         </CommandList>
       </Command>
     </PopoverContent>
   </Popover>
   ```

---

### Preserved Features
- ✅ Color-coded dots for each category
- ✅ Group headings (Acquisition/Admin, Structural/Exterior, etc.)
- ✅ Color-coded group labels
- ✅ Selected state border styling
- ✅ Group label displayed under the dropdown when selected

---

### Result

| Before | After |
|--------|-------|
| Scroll through all ~30 categories | Type "tile" → instantly find "Tile" |
| No filtering | Fuzzy match on category name AND group name |
| Standard Select UI | Combobox with search input |


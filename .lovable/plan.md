

## Plan: Add "Other" Category Option with Edit/Delete for Document Categories

### Overview
Add the ability to:
1. Select "Other" in the category dropdown and type a custom category name
2. Custom categories are stored as plain text in the `category` column (already supports this)
3. Display custom categories in the filter dropdown alongside default ones
4. Allow editing/deleting custom categories (by updating the document's category value)

---

### How It Will Work

**When uploading a document:**
```text
Category: [▾ Select category     ]
          ┌─────────────────────┐
          │ Permit              │
          │ Contract            │
          │ Invoice             │
          │ ...                 │
          │ General             │
          │─────────────────────│
          │ + Other (custom)... │
          └─────────────────────┘

User selects "Other" →

Category: [▾ Other              ]
Custom:   [________________     ]  ← Input appears for custom name
```

**In the filter dropdown:**
- Show all default categories
- Also show any unique custom categories found in the project's documents
- Custom categories appear below "General" with a distinct style

---

### UI Changes

**Upload/Preview Modals:**
| Element | Change |
|---------|--------|
| Category dropdown | Add "Other (custom)..." option at bottom |
| Custom input field | Show when "Other" is selected, allows typing custom category |
| Validation | Require custom category name if "Other" is selected |

**Filter Dropdown (DocumentsGallery):**
| Element | Change |
|---------|--------|
| Category list | Dynamically include custom categories from documents |
| Custom categories | Show with "(custom)" suffix and italic style |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | Fetch unique categories from documents; merge with defaults for filter |
| `src/components/project/DocumentUploadModal.tsx` | Add "Other" option; show text input for custom category name |
| `src/components/project/DocumentPreviewModal.tsx` | Add "Other" option; allow changing to/from custom category |

---

### Technical Implementation

**1. Upload Modal - Add "Other" option:**

```typescript
const [isCustomCategory, setIsCustomCategory] = useState(false);
const [customCategoryName, setCustomCategoryName] = useState('');

// Category selection handler
const handleCategoryChange = (value: string) => {
  if (value === 'other') {
    setIsCustomCategory(true);
    setCategory('');
  } else {
    setIsCustomCategory(false);
    setCategory(value);
  }
};

// Final category value for saving
const finalCategory = isCustomCategory ? customCategoryName.trim() : category;
```

**2. Upload Modal - UI for custom input:**

```tsx
<Select value={isCustomCategory ? 'other' : category} onValueChange={handleCategoryChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    {DOCUMENT_CATEGORIES.map((cat) => (
      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
    ))}
    <SelectItem value="other" className="border-t mt-1 pt-1">
      + Other (custom)...
    </SelectItem>
  </SelectContent>
</Select>

{isCustomCategory && (
  <div className="space-y-2 mt-2">
    <Label>Custom Category Name</Label>
    <Input
      placeholder="e.g., Warranty, Change Order, Quote..."
      value={customCategoryName}
      onChange={(e) => setCustomCategoryName(e.target.value)}
    />
  </div>
)}
```

**3. Gallery Filter - Include custom categories:**

```typescript
// Get unique categories from documents that aren't in the default list
const customCategories = useMemo(() => {
  const defaultValues = DOCUMENT_CATEGORIES.map(c => c.value);
  const uniqueCategories = [...new Set(documents.map(d => d.category))];
  return uniqueCategories.filter(cat => !defaultValues.includes(cat));
}, [documents]);

// In the Select component
<SelectContent>
  <SelectItem value="all">All</SelectItem>
  {DOCUMENT_CATEGORIES.map((cat) => (
    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
  ))}
  {customCategories.length > 0 && (
    <>
      <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1">
        Custom
      </div>
      {customCategories.map((cat) => (
        <SelectItem key={cat} value={cat}>
          {cat}
        </SelectItem>
      ))}
    </>
  )}
</SelectContent>
```

**4. Preview Modal - Support editing custom categories:**

Same pattern as upload modal - detect if current category is custom (not in defaults), allow switching between default and custom.

---

### Editing/Deleting Custom Categories

- **Edit**: Change the document's category in the preview modal (already supported - just select a different category or type a new custom name)
- **Delete**: When no documents use a custom category, it automatically disappears from the filter dropdown (dynamic lookup)

No separate category management UI needed - categories are derived from document data.

---

### Validation

| Rule | Behavior |
|------|----------|
| Empty custom name | Disable upload/save button |
| Duplicate check | Not needed (duplicates just group documents) |
| Trim whitespace | Apply on save |

---

### Result

| Before | After |
|--------|-------|
| Only 7 fixed categories | Unlimited custom categories via "Other" |
| No way to add new types | Type any category name |
| Static filter list | Dynamic filter includes custom categories |


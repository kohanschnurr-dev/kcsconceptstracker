

## Plan: Make Baselines Section Collapsible

### Overview

Convert the "Baselines" section in the TemplatePicker dropdown into a collapsible section that can be expanded/collapsed to save vertical space in the dropdown menu.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/budget/TemplatePicker.tsx` | Wrap Baselines section with Collapsible component |

---

### UI Design

**Collapsed State:**
```text
┌──────────────────────────────────┐
│ + Start Blank                    │
├──────────────────────────────────┤
│ ▶ Baselines                   ⚙️ │
├──────────────────────────────────┤
│ 📁 Your Saved Budgets            │
│ ...                              │
└──────────────────────────────────┘
```

**Expanded State:**
```text
┌──────────────────────────────────┐
│ + Start Blank                    │
├──────────────────────────────────┤
│ ▼ Baselines                   ⚙️ │
│   Cosmetic          $35/sqft     │
│   Standard          $45/sqft     │
│   High Level        $55/sqft     │
│   Overhaul          $65/sqft     │
├──────────────────────────────────┤
│ 📁 Your Saved Budgets            │
│ ...                              │
└──────────────────────────────────┘
```

---

### Technical Details

**File: `src/components/budget/TemplatePicker.tsx`**

#### 1. Add imports

```typescript
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
```

#### 2. Add state for baselines expansion

```typescript
const [baselinesOpen, setBaselinesOpen] = useState(true); // Start expanded
```

#### 3. Replace the Baselines section with a Collapsible

Wrap the DropdownMenuLabel and baseline items in a Collapsible:

```tsx
<Collapsible open={baselinesOpen} onOpenChange={setBaselinesOpen}>
  <CollapsibleTrigger asChild>
    <div 
      className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ChevronRight 
          className={`h-3 w-3 transition-transform ${baselinesOpen ? 'rotate-90' : ''}`} 
        />
        <Ruler className="h-3 w-3" />
        Baselines
      </div>
      <button
        onClick={handleOpenEdit}
        className="p-1 hover:bg-accent rounded-sm transition-colors"
      >
        <Settings className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  </CollapsibleTrigger>
  
  <CollapsibleContent>
    {baselineTiers.map((tier, index) => {
      // ... existing tier rendering
    })}
  </CollapsibleContent>
</Collapsible>
```

#### 4. Handle click propagation

Ensure clicking the collapse trigger doesn't close the dropdown by using `e.stopPropagation()`.

---

### User Flow

1. User opens the Template Picker dropdown
2. Baselines section starts expanded (default)
3. User can click the "Baselines" header to collapse/expand the section
4. Chevron icon rotates to indicate state (▶ collapsed, ▼ expanded)
5. Settings icon remains accessible to edit baseline rates
6. Collapsed state saves vertical space in the dropdown

---

### Files to Modify

| File | Key Changes |
|------|-------------|
| `src/components/budget/TemplatePicker.tsx` | Add `ChevronRight` import, add Collapsible imports, add `baselinesOpen` state, wrap Baselines section with Collapsible component |


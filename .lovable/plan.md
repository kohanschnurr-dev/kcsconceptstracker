
## Plan: Add Notes Field to Vendor Management

### Current State
The vendors table and edit modal do not have a notes field. The user wants to add the ability to store general notes about each vendor.

### Changes Required

#### 1. Database Migration
Add a `notes` column to the `vendors` table:

```sql
ALTER TABLE public.vendors ADD COLUMN notes text;
```

#### 2. Update NewVendorModal Component

**File: `src/components/NewVendorModal.tsx`**

| Change | Details |
|--------|---------|
| Import | Add `Textarea` component |
| State | Add `notes` state variable |
| Populate | Load notes when editing |
| Reset | Clear notes when modal closes |
| Submit | Include notes in insert/update |
| UI | Add Notes textarea field |
| Remove | W9 toggle section (already hidden from cards) |

**State changes:**
```typescript
const [notes, setNotes] = useState('');
```

**useEffect update:**
```typescript
// When editing
setNotes(vendor.notes || '');

// When closing
setNotes('');
```

**Submit update:**
```typescript
// In update/insert
notes: notes || null,
```

**New UI field (after Reliability Rating, replacing W9 toggle):**
```tsx
<div className="space-y-2">
  <Label>Notes</Label>
  <Textarea
    placeholder="General notes about this vendor..."
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    className="min-h-[80px] resize-none"
  />
</div>
```

#### 3. Update Vendor Interface

Add notes to the Vendor interface in the modal:
```typescript
interface Vendor {
  // ... existing fields
  notes: string | null;  // Add this
}
```

### Summary

| Step | Action |
|------|--------|
| 1 | Add `notes` column to vendors table |
| 2 | Add notes state and form field to modal |
| 3 | Remove W9 toggle from modal UI |
| 4 | Update insert/update to include notes |

This allows users to store general information about vendors like availability, special instructions, or past experiences.

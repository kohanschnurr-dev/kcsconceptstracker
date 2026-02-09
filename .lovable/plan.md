

## Plan: Add Expand/Collapse Feature to Pending Transaction Cards

### Overview
Add a clickable expand/collapse feature to single (non-split) pending QuickBooks expense cards so users can view the full transaction description, notes, and other valuable information that might be truncated.

---

### Current Behavior

The single expense cards show truncated text:
```
Amazon
Jan 31, 2026 • AMAZON MARKETPLACE NAMZ...
```

The description gets cut off at 200px with the `truncate` class, hiding potentially valuable information.

---

### Proposed Behavior

| State | Display |
|-------|---------|
| **Collapsed** (default) | Current view with truncated description + small chevron indicator |
| **Expanded** | Full description, notes, and any additional details visible |

---

### Technical Changes

**File: `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**

#### 1. Add expand state for single expenses (Line ~71)

Add a new state variable for single expense expansion:
```typescript
const [isSingleExpanded, setIsSingleExpanded] = useState(false);
```

#### 2. Update single expense card layout (Lines 131-272)

Modify the single expense rendering to include:

a. **Add expand/collapse chevron indicator** in the header row, making the info area clickable:
```tsx
<div 
  className="flex-1 cursor-pointer"
  onClick={() => setIsSingleExpanded(!isSingleExpanded)}
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      {isSingleExpanded ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <p className="font-medium">{primaryExpense.vendor_name || 'Unknown Vendor'}</p>
      {/* ...badges */}
    </div>
    {/* ...amount and delete button */}
  </div>
  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 ml-6">
    <span>{formatDisplayDate(primaryExpense.date)}</span>
    {primaryExpense.description && !isSingleExpanded && (
      <>
        <span>•</span>
        <span className="truncate max-w-[200px]">
          {primaryExpense.description}
        </span>
      </>
    )}
  </div>
</div>
```

b. **Add expanded details section** that shows when clicked:
```tsx
{isSingleExpanded && (
  <div className="mt-2 ml-6 p-2 rounded bg-muted/30 border border-border/50 text-sm space-y-1">
    {primaryExpense.description && (
      <div>
        <span className="text-muted-foreground">Description: </span>
        <span className="text-foreground">{primaryExpense.description}</span>
      </div>
    )}
    {primaryExpense.notes && (
      <div>
        <span className="text-muted-foreground">Notes: </span>
        <span className="text-foreground">{primaryExpense.notes}</span>
      </div>
    )}
    {!primaryExpense.description && !primaryExpense.notes && (
      <p className="text-muted-foreground italic">No additional details available</p>
    )}
  </div>
)}
```

---

### Visual Result

**Collapsed State:**
```
▼ Amazon                                    $45.99 🗑
  Jan 31, 2026 • AMAZON MARKETPLACE NAMZ...
```

**Expanded State:**
```
▲ Amazon                                    $45.99 🗑
  Jan 31, 2026
  ┌─────────────────────────────────────────────────┐
  │ Description: AMAZON MARKETPLACE NAMZYA LLC -    │
  │              Industrial Hardware Supplies       │
  │ Notes: Ordered replacement parts for garage     │
  └─────────────────────────────────────────────────┘
```

---

### UX Considerations

- Chevron provides visual affordance that the card is expandable
- Clicking the vendor/description area toggles expansion (not the amount or delete button)
- Expanded state shows full untruncated text
- Consistent with the existing expand/collapse pattern used for split expense groups


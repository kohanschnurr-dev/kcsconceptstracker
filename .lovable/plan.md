

## Plan: Add Business Assignment Option to SmartSplit

### Overview
Allow SmartSplit receipts to be assigned to "Business" (KCS Concepts) in addition to projects. When selected, expenses will be imported into the `business_expenses` table instead of the project-linked `quickbooks_expenses` table.

---

### Current Flow
1. User uploads receipt
2. Receipt matches to QuickBooks transaction
3. User selects a **project** to assign the expense to
4. Line items are split by category and inserted into `quickbooks_expenses` with project/category links

### New Flow
1. User uploads receipt
2. Receipt matches to QuickBooks transaction
3. User selects **Project** OR **Business (KCS Concepts)**
4. If Business: insert into `business_expenses` table with business categories
5. If Project: existing flow unchanged

---

### UI Changes

**SmartSplit Modal - Assignment Section:**

```text
Before:
┌─────────────────────────────────────┐
│ Assign to Project                   │
│ [🏢 Search projects...          ▼]  │
└─────────────────────────────────────┘

After:
┌─────────────────────────────────────┐
│ Assign to                           │
│ ┌─────────────┐ ┌────────────────┐  │
│ │ 🏠 Project  │ │ 🏢 Business    │  │
│ └─────────────┘ └────────────────┘  │
│                                     │
│ [🏢 Search projects...          ▼]  │  ← Shows only when Project selected
│        OR                           │
│ KCS Concepts (auto-selected)        │  ← Shows when Business selected
└─────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/components/SmartSplitReceiptUpload.tsx`**

1. **Add state for assignment type:**
   ```typescript
   const [assignmentType, setAssignmentType] = useState<'project' | 'business'>('project');
   ```

2. **Import business categories and company settings:**
   ```typescript
   import { BUDGET_CATEGORIES, BUSINESS_EXPENSE_CATEGORIES } from '@/types';
   import { useCompanySettings } from '@/hooks/useCompanySettings';
   ```

3. **Update category options based on assignment type:**
   - When `project` selected: use existing `categoryOptions` (BUDGET_CATEGORIES values)
   - When `business` selected: use `BUSINESS_EXPENSE_CATEGORIES` values

4. **Add toggle UI in the modal:**
   ```tsx
   <div className="space-y-4 pt-4 border-t border-border">
     <h4 className="text-sm font-medium">Assign to</h4>
     <ToggleGroup
       type="single"
       value={assignmentType}
       onValueChange={(value) => value && setAssignmentType(value as 'project' | 'business')}
     >
       <ToggleGroupItem value="project">
         <Home className="h-3 w-3" /> Project
       </ToggleGroupItem>
       <ToggleGroupItem value="business">
         <Building2 className="h-3 w-3" /> {companyName}
       </ToggleGroupItem>
     </ToggleGroup>
     
     {assignmentType === 'project' && (
       <ProjectAutocomplete ... />
     )}
     {assignmentType === 'business' && (
       <div className="text-sm text-muted-foreground">
         Expense will be added to {companyName} business expenses
       </div>
     )}
   </div>
   ```

5. **Update `finalizeImport` function:**
   - If `assignmentType === 'business'`:
     - Insert each category group into `business_expenses` table
     - Skip project_categories logic
     - Still mark original QB expense as imported
   - If `assignmentType === 'project'`:
     - Existing flow unchanged

6. **Update validation:**
   - Change `!selectedProject` check to `!(selectedProject || assignmentType === 'business')`

---

### Database Flow

**Business Assignment:**
```text
QuickBooks Transaction ($89.15)
         │
         ▼
┌─────────────────────────────────────┐
│ business_expenses (new records)     │
├─────────────────────────────────────┤
│ category: 'subscriptions'           │
│ amount: $48.00                      │
│ vendor_name: 'Call Tools'           │
│ notes: 'One time setup fees...'     │
├─────────────────────────────────────┤
│ category: 'subscriptions'           │
│ amount: $32.00                      │
│ vendor_name: 'Call Tools'           │
│ notes: 'Monthly fees...'            │
└─────────────────────────────────────┘
         +
┌─────────────────────────────────────┐
│ quickbooks_expenses (mark imported) │
│ is_imported: true                   │
│ (keeps original for audit trail)    │
└─────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SmartSplitReceiptUpload.tsx` | Add assignment type toggle, update category options dynamically, modify finalizeImport to handle business expenses |

---

### Expected Result
- Users can assign SmartSplit receipts to either a project or their business
- Business assignments use business-specific categories (subscriptions, internet, etc.)
- Business expenses appear in the Business Expenses page
- QB transaction is marked imported regardless of assignment type


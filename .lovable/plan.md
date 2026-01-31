
## Fix: Pass Projects to SmartSplit on Business Expenses Page

### The Problem
The `SmartSplitReceiptUpload` component on the Business Expenses page shows "No projects found" because no projects are being passed to it. Currently:
- `BusinessExpenses.tsx` renders `<BusinessQuickBooksIntegration />` 
- `BusinessQuickBooksIntegration` renders `<SmartSplitReceiptUpload />` **without** the `projects` prop
- The component defaults to an empty array

### Solution
Fetch projects in `BusinessExpenses.tsx` and pass them through to the SmartSplit component.

---

### Technical Changes

**File: `src/pages/BusinessExpenses.tsx`**

| Change | Description |
|--------|-------------|
| Add projects state | `const [projects, setProjects] = useState([])` |
| Fetch projects in `fetchData` | Query `projects` table |
| Pass to BusinessQuickBooksIntegration | `<BusinessQuickBooksIntegration projects={projects} />` |

**File: `src/components/BusinessQuickBooksIntegration.tsx`**

| Change | Description |
|--------|-------------|
| Accept projects prop | Add `projects` to interface |
| Pass to SmartSplitReceiptUpload | `<SmartSplitReceiptUpload projects={projects} />` |

---

### Specific Code Changes

**1. BusinessExpenses.tsx - Add Projects State & Fetch**

```tsx
// Add state near other state declarations
const [projects, setProjects] = useState<{id: string; name: string; address?: string}[]>([]);

// In fetchData function, add projects query:
const { data: projectsData } = await supabase
  .from('projects')
  .select('id, name, address')
  .order('name');

setProjects(projectsData || []);
```

**2. BusinessExpenses.tsx - Pass to Component**

```tsx
<BusinessQuickBooksIntegration 
  onExpenseImported={fetchData}
  projects={projects}  // Add this
/>
```

**3. BusinessQuickBooksIntegration.tsx - Accept & Forward Prop**

```tsx
interface BusinessQuickBooksIntegrationProps {
  onExpenseImported?: () => void;
  projects?: { id: string; name: string; address?: string }[];  // Add this
}

export function BusinessQuickBooksIntegration({ 
  onExpenseImported,
  projects = []  // Add this
}: BusinessQuickBooksIntegrationProps) {
  // ...
  
  // Pass to SmartSplit
  <SmartSplitReceiptUpload 
    onReceiptProcessed={onExpenseImported}
    projects={projects}  // Add this
  />
}
```

---

### Data Flow After Fix

```text
BusinessExpenses.tsx
  └── fetches projects from database
  └── passes projects to BusinessQuickBooksIntegration
        └── passes projects to SmartSplitReceiptUpload
              └── ProjectAutocomplete shows real projects
```

---

### Summary
- Fetch projects from database in BusinessExpenses page
- Thread the `projects` prop through BusinessQuickBooksIntegration to SmartSplitReceiptUpload
- This matches how it already works on ProjectDetail page (which does pass projects)



## Change "Expenses" Card to "Procurement" Quick-Link

### What changes
The 4th summary card on the Project Detail page currently shows "Expenses" with the expense count and navigates to the Budget page. It will be changed to show "Procurement" and directly activate the Procurement tab on the same page.

### Steps

1. **Add Procurement tab to Project Detail** (`src/pages/ProjectDetail.tsx`)
   - Import `ProcurementTab` and `ShoppingCart` icon
   - Add `'procurement'` to `DEFAULT_DETAIL_TAB_ORDER` and `TAB_LABELS`
   - Add a `TabsContent` for procurement rendering `<ProcurementTab projectId={id!} />`

2. **Change the 4th summary card** (`src/pages/ProjectDetail.tsx`)
   - Replace "Expenses" label with "Procurement"
   - Replace `Receipt` icon with `ShoppingCart`
   - Fetch the count of procurement items assigned to this project from `project_procurement_items`
   - Display that count instead of the expenses count
   - Instead of navigating to `/projects/${id}/budget`, make the card programmatically switch the active tab to `procurement`

3. **Make tabs controllable** (`src/pages/ProjectDetail.tsx`)
   - Convert the `Tabs` component from uncontrolled (`defaultValue`) to controlled (`value` + `onValueChange`) using a `useState`
   - The procurement card click sets the tab value to `'procurement'`

### Technical Details

- Add state: `const [activeTab, setActiveTab] = useState(effectiveTabOrder[0])`
- Add state: `const [procurementCount, setProcurementCount] = useState(0)`
- Fetch procurement count in `fetchProjectData`: query `project_procurement_items` where `project_id = id`, use `.select('id', { count: 'exact', head: true })`
- Card onClick: `setActiveTab('procurement')` plus scroll the tabs into view
- `ShoppingCart` is already imported via lucide-react in other files; just add the import here

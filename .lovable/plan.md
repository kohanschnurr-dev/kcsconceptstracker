

## Plan: Add Delete and Edit Functionality for Loan Presets

### Overview

Add the ability for users to delete and edit their saved loan presets. Built-in presets cannot be modified.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Add edit/delete buttons in dropdown, add edit dialog, add delete handler |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

#### 1. Add new imports

```tsx
import { Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
```

#### 2. Add new state variables

```tsx
// Edit preset dialog
const [editPresetOpen, setEditPresetOpen] = useState(false);
const [editingPreset, setEditingPreset] = useState<LoanPreset | null>(null);
const [editPresetName, setEditPresetName] = useState('');
const [editInterestRate, setEditInterestRate] = useState(0);
const [editLoanTermMonths, setEditLoanTermMonths] = useState(0);
const [editPoints, setEditPoints] = useState(0);
const [editClosingCostsPercent, setEditClosingCostsPercent] = useState(2);
const [editInterestOnly, setEditInterestOnly] = useState(true);
const [updatingPreset, setUpdatingPreset] = useState(false);

// Delete confirmation
const [deletePresetOpen, setDeletePresetOpen] = useState(false);
const [deletingPreset, setDeletingPreset] = useState<LoanPreset | null>(null);
```

#### 3. Add delete handler function

```tsx
const handleDeletePreset = async (preset: LoanPreset) => {
  if (!preset.id) return;

  const { error } = await supabase
    .from('loan_presets')
    .delete()
    .eq('id', preset.id);

  if (error) {
    toast.error('Failed to delete preset');
    console.error(error);
  } else {
    setUserPresets(prev => prev.filter(p => p.id !== preset.id));
    toast.success(`Preset "${preset.name}" deleted`);
  }
  setDeletePresetOpen(false);
  setDeletingPreset(null);
};
```

#### 4. Add edit handler function

```tsx
const openEditDialog = (preset: LoanPreset) => {
  setEditingPreset(preset);
  setEditPresetName(preset.name);
  setEditInterestRate(preset.interestRate);
  setEditLoanTermMonths(preset.loanTermMonths);
  setEditPoints(preset.points);
  setEditClosingCostsPercent(preset.closingCostsPercent);
  setEditInterestOnly(preset.interestOnly);
  setEditPresetOpen(true);
};

const handleUpdatePreset = async () => {
  if (!editingPreset?.id || !editPresetName.trim()) {
    toast.error('Please enter a preset name');
    return;
  }

  setUpdatingPreset(true);

  const { error } = await supabase
    .from('loan_presets')
    .update({
      name: editPresetName.trim(),
      interest_rate: editInterestRate,
      loan_term_months: editLoanTermMonths,
      points: editPoints,
      closing_costs_percent: editClosingCostsPercent,
      interest_only: editInterestOnly,
    })
    .eq('id', editingPreset.id);

  if (error) {
    toast.error('Failed to update preset');
    console.error(error);
  } else {
    setUserPresets(prev => prev.map(p => 
      p.id === editingPreset.id 
        ? {
            ...p,
            name: editPresetName.trim(),
            interestRate: editInterestRate,
            loanTermMonths: editLoanTermMonths,
            points: editPoints,
            closingCostsPercent: editClosingCostsPercent,
            interestOnly: editInterestOnly,
          }
        : p
    ));
    toast.success(`Preset "${editPresetName}" updated`);
    setEditPresetOpen(false);
    setEditingPreset(null);
  }
  setUpdatingPreset(false);
};
```

#### 5. Update the preset dropdown in header

Replace the current Select dropdown with a DropdownMenu that includes edit/delete buttons for user presets:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm" className="w-[180px] justify-start">
      <Package className="h-4 w-4 mr-2" />
      Load Preset
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuLabel>Built-in Presets</DropdownMenuLabel>
    {BUILT_IN_PRESETS.map((preset) => (
      <DropdownMenuItem key={preset.name} onClick={() => loadPreset(preset)}>
        {preset.name}
      </DropdownMenuItem>
    ))}
    {userPresets.length > 0 && (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>My Presets</DropdownMenuLabel>
        {userPresets.map((preset) => (
          <div key={preset.id} className="flex items-center group">
            <DropdownMenuItem 
              className="flex-1"
              onClick={() => loadPreset(preset)}
            >
              {preset.name}
            </DropdownMenuItem>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                openEditDialog(preset);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingPreset(preset);
                setDeletePresetOpen(true);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

#### 6. Add Edit Preset Dialog

```tsx
{/* Edit Preset Dialog */}
<Dialog open={editPresetOpen} onOpenChange={setEditPresetOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Loan Preset</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-preset-name">Preset Name</Label>
        <Input
          id="edit-preset-name"
          value={editPresetName}
          onChange={(e) => setEditPresetName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-interest-rate">Interest Rate (%)</Label>
          <Input
            id="edit-interest-rate"
            type="number"
            value={editInterestRate}
            onChange={(e) => setEditInterestRate(Number(e.target.value))}
            step={0.01}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-term">Term (Months)</Label>
          <Input
            id="edit-term"
            type="number"
            value={editLoanTermMonths}
            onChange={(e) => setEditLoanTermMonths(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-points">Points (%)</Label>
          <Input
            id="edit-points"
            type="number"
            value={editPoints}
            onChange={(e) => setEditPoints(Number(e.target.value))}
            step={0.5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-closing">Closing Costs (%)</Label>
          <Input
            id="edit-closing"
            type="number"
            value={editClosingCostsPercent}
            onChange={(e) => setEditClosingCostsPercent(Number(e.target.value))}
            step={0.5}
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-3 rounded-sm bg-muted/50">
        <Label htmlFor="edit-interest-only">Interest Only</Label>
        <Switch
          id="edit-interest-only"
          checked={editInterestOnly}
          onCheckedChange={setEditInterestOnly}
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setEditPresetOpen(false)}>Cancel</Button>
      <Button onClick={handleUpdatePreset} disabled={updatingPreset}>
        {updatingPreset ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
        Update Preset
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 7. Add Delete Confirmation Dialog

```tsx
{/* Delete Confirmation Dialog */}
<AlertDialog open={deletePresetOpen} onOpenChange={setDeletePresetOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Preset</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete "{deletingPreset?.name}"? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={() => deletingPreset && handleDeletePreset(deletingPreset)}
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Visual Result

**Preset Dropdown (with user presets):**
```text
┌─────────────────────────────────┐
│ Load Preset                  ▼  │
├─────────────────────────────────┤
│ Built-in Presets                │
│   Standard Hard Money           │
│   Competitive Rate              │
│   Extended Term                 │
│   Conventional 30yr             │
├─────────────────────────────────┤
│ My Presets                      │
│   My Lender Terms    [✏️] [🗑️]  │  <-- Edit/Delete on hover
│   Bank of America    [✏️] [🗑️]  │
└─────────────────────────────────┘
```

**Edit Dialog:**
```text
┌───────────────────────────────────────┐
│ Edit Loan Preset                   ✕  │
├───────────────────────────────────────┤
│ Preset Name                           │
│ ┌─────────────────────────────────┐   │
│ │ My Lender Terms                 │   │
│ └─────────────────────────────────┘   │
│                                       │
│ Interest Rate (%)    Term (Months)    │
│ ┌─────────────┐     ┌─────────────┐   │
│ │     10      │     │     12      │   │
│ └─────────────┘     └─────────────┘   │
│                                       │
│ Points (%)          Closing Costs (%) │
│ ┌─────────────┐     ┌─────────────┐   │
│ │      2      │     │      2      │   │
│ └─────────────┘     └─────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ Interest Only              [✓] │   │
│ └─────────────────────────────────┘   │
│                                       │
│              [Cancel] [Update Preset] │
└───────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Add imports, state, handlers, dropdown with edit/delete, edit dialog, delete confirmation |




## Plan: Collapsible Presets Section with Default Preset Indicator

### Overview

Add two features to the Loan Calculator:
1. A collapsible presets section that can be hidden to save space
2. A star indicator for the preset that is set as the "default" (auto-populates when loading the calculator)

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Add collapsible preset section, star indicator, set-as-default functionality |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

#### 1. Add new imports

```tsx
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
```

#### 2. Add new state variables

```tsx
// Presets visibility
const [presetsOpen, setPresetsOpen] = useState(false);

// Default preset
const [defaultPresetId, setDefaultPresetId] = useState<string | null>(null);
```

#### 3. Update LoanPreset interface

```tsx
interface LoanPreset {
  id?: string;
  name: string;
  interestRate: number;
  loanTermMonths: number;
  points: number;
  closingCostsPercent: number;
  interestOnly: boolean;
  isBuiltIn?: boolean;
  isDefault?: boolean;  // Add this field
}
```

#### 4. Update preset fetching to track default

Update the `fetchPresets` function to also track which preset is the default:

```tsx
if (data) {
  const presets = data.map(p => ({
    id: p.id,
    name: p.name,
    interestRate: Number(p.interest_rate),
    loanTermMonths: p.loan_term_months,
    points: Number(p.points),
    closingCostsPercent: Number(p.closing_costs_percent),
    interestOnly: p.interest_only,
    isDefault: p.is_default,
  }));
  setUserPresets(presets);
  
  // Find and auto-load the default preset
  const defaultPreset = presets.find(p => p.isDefault);
  if (defaultPreset) {
    setDefaultPresetId(defaultPreset.id || null);
    // Only auto-load if no initial values were provided
    if (!initialLoanAmount) {
      loadPreset(defaultPreset);
    }
  }
}
```

#### 5. Add "Set as Default" handler

```tsx
const handleSetDefaultPreset = async (preset: LoanPreset) => {
  if (!preset.id) return;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // First, clear any existing default
  await supabase
    .from('loan_presets')
    .update({ is_default: false })
    .eq('user_id', user.id);

  // Then set the new default
  const { error } = await supabase
    .from('loan_presets')
    .update({ is_default: true })
    .eq('id', preset.id);

  if (error) {
    toast.error('Failed to set default preset');
    console.error(error);
  } else {
    setDefaultPresetId(preset.id);
    setUserPresets(prev => prev.map(p => ({
      ...p,
      isDefault: p.id === preset.id,
    })));
    toast.success(`"${preset.name}" set as default`);
  }
};
```

#### 6. Update the header with collapsible presets

Replace the current preset buttons in the header with a collapsible section:

```tsx
<CardHeader className="flex flex-row items-center justify-between pb-4">
  <CardTitle className="text-lg flex items-center gap-2">
    <Landmark className="h-5 w-5 text-primary" />
    Loan Calculator
  </CardTitle>
  <div className="flex items-center gap-2">
    <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Presets
          {presetsOpen ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
    <Button size="sm" onClick={handleSave} disabled={saving}>
      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
      Save
    </Button>
  </div>
</CardHeader>
```

#### 7. Add collapsible preset content panel

Add below CardHeader (before CardContent):

```tsx
<Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
  <CollapsibleContent className="border-b border-border">
    <div className="px-6 py-4 bg-muted/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Loan Presets</h4>
        <Button size="sm" variant="outline" onClick={() => setSavePresetOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Save Current
        </Button>
      </div>
      
      {/* Built-in Presets */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Built-in</p>
        <div className="flex flex-wrap gap-2">
          {BUILT_IN_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => loadPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* User Presets */}
      {userPresets.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">My Presets</p>
          <div className="flex flex-wrap gap-2">
            {userPresets.map((preset) => (
              <div key={preset.id} className="flex items-center gap-1 group">
                <Button
                  variant={preset.isDefault ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => loadPreset(preset)}
                  className="flex items-center gap-1"
                >
                  {preset.isDefault && <Star className="h-3 w-3 fill-current" />}
                  {preset.name}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSetDefaultPreset(preset)}>
                      <Star className="h-4 w-4 mr-2" />
                      Set as Default
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(preset)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => {
                        setDeletingPreset(preset);
                        setDeletePresetOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </CollapsibleContent>
</Collapsible>
```

---

### Visual Result

**Collapsed State (Default):**
```text
┌─────────────────────────────────────────────────────────────┐
│ 🏛 Loan Calculator              [Presets ▼] [Save]          │
└─────────────────────────────────────────────────────────────┘
```

**Expanded State:**
```text
┌─────────────────────────────────────────────────────────────┐
│ 🏛 Loan Calculator              [Presets ▲] [Save]          │
├─────────────────────────────────────────────────────────────┤
│ Loan Presets                           [+ Save Current]     │
│                                                             │
│ Built-in                                                    │
│ ┌──────────────────┐ ┌────────────────┐ ┌─────────────┐    │
│ │ Standard Hard... │ │ Competitive... │ │ Extended... │    │
│ └──────────────────┘ └────────────────┘ └─────────────┘    │
│                                                             │
│ My Presets                                                  │
│ ┌────────────────────┐ ┌──────────────┐                    │
│ │ ⭐ My Lender [⋮]  │ │ Bank ABC [⋮] │  <- Default has star │
│ └────────────────────┘ └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

**Dropdown Menu for User Presets:**
```text
┌─────────────────────┐
│ ⭐ Set as Default   │
│ ✏️ Edit             │
│ ─────────────────── │
│ 🗑️ Delete           │
└─────────────────────┘
```

---

### Behavior

1. **Collapsed by default** - The presets section is hidden, saving vertical space
2. **Click "Presets" to expand** - Shows all built-in and user presets
3. **Star indicates default** - The preset marked as default shows a filled star icon
4. **Auto-load on mount** - If a default preset exists and no initial loan values are set, it auto-loads
5. **Set as Default menu option** - Right-click menu (or ⋮ button) includes "Set as Default" option

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Add collapsible imports, state, default preset logic, UI changes |


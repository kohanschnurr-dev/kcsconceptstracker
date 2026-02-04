

## Plan: Redesign Business Expenses into Project & Ops Command Center

### Overview
Transform the existing Business Expenses page (`BusinessExpenses.tsx`) into a high-utility "Project & Ops Command Center" with three new modules: Codes (Order of Operations), Goals (Quarterly Targets), and a condensed Cash Flow widget. The design will feature a dark mode, high-contrast, industrial "Pro-Tools" aesthetic with maximum data density.

---

### Current State
```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Header: KCS Concepts + Export/Add buttons                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ SmartSplit Receipt Matching (collapsible)                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ QuickBooks Integration (collapsible)                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Business Receipt Upload (collapsible)                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Dashboard Overview (collapsible)                                             │
│  [30-Day Sparkline]     [Category Cubes Grid]                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ Expenses Table (collapsible with filters in header)                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### New Layout Design
```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ KCS Concepts Command Center                               [Export] [+ Add]  │
├─────────────────────────────┬────────────────────────────────────────────────┤
│                             │                                                │
│  ORDER OF OPERATIONS        │    OPERATIONS DASHBOARD                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━   │    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  [■] Foundation First       │    ┌─────────────────┐  ┌─────────────────────┐│
│  [■] Structural Complete    │    │  CASH FLOW      │  │  GOALS (Q1 2026)    ││
│  [□] Pre-Sheetrock Inspect  │    │  $2,939 (30d)   │  │                     ││
│  [□] HVAC Before Drywall    │    │  ▔▔▔▔▔▔▔▔▔▔▔▔   │  │ ▓▓▓▓▓▓░░░ 3/5      ││
│  [□] Electrical Sign-off    │    │  [Donut Chart]  │  │ Flips Closed        ││
│      ...                    │    │                 │  │                     ││
│  ─────────────────────────  │    └─────────────────┘  │ ▓▓▓▓▓▓▓▓░ 8/10     ││
│  [+ Add Rule]               │                         │ Multi-family Deals  ││
│                             │    ┌─────────────────────────────────────────┐││
│  QUICKBOOKS                 │    │ SmartSplit Receipt Matching        [Beta]│
│  ─────────────────────────  │    └─────────────────────────────────────────┘│
│  [⬤] Connected | 49 pending │    ┌─────────────────────────────────────────┐│
│                             │    │ Business Receipt Upload             [Open]│
│                             │    └─────────────────────────────────────────┘│
├─────────────────────────────┴────────────────────────────────────────────────┤
│ EXPENSE LEDGER                            [Search] [Category] [Date] [Reset] │
│ 18 expenses • $3,045.64                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ Date       │ Vendor              │ Category      │ Payment │ Amount          │
│ Feb 2, 2026│ ADAM TRAYWIC...     │ Licensing     │ Cash    │ $258.00         │
│ ...                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### New Modules

#### 1. The "Codes" Module (Order of Operations Widget)
A dedicated sidebar component for immutable project rules that can be pinned globally.

**Data Structure (new database table):**
```sql
CREATE TABLE operation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Codes (seeded on first load):**
- Foundation First
- Cast Iron Scoping Mandatory
- Pre-Sheetrock HVAC Inspection
- Electrical Before Drywall
- Structural Sign-off Required
- Permit Verification

**Component: `src/components/ops/OperationCodesPanel.tsx`**
- Checklist UI with checkbox toggles
- Drag-to-reorder capability
- Add new rule inline input
- Collapsible by category (if needed)

---

#### 2. The "Goals" Module (Quarterly Targets)
Progress tracking for quarterly business targets.

**Data Structure (new database table):**
```sql
CREATE TABLE quarterly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  quarter TEXT NOT NULL, -- e.g., 'Q1 2026'
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Component: `src/components/ops/QuarterlyGoalsCard.tsx`**
- Visual progress bars using existing Progress component
- Gauge-style percentage display
- Editable current value (click to increment)
- Add new goal capability

**Default Goals:**
- 3 Flips Closed
- Underwrite 10 Multi-family Deals
- 2 Rental Acquisitions

---

#### 3. Refined Cash Flow Widget
Replace the current two-card grid with a single, condensed widget.

**Component: `src/components/ops/CashFlowWidget.tsx`**
- Compact donut chart (category breakdown)
- 30-day total with trend indicator
- Top 5 categories listed vertically
- Click category to filter expense table

---

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/BusinessExpenses.tsx` | MODIFY | Restructure layout to 2-column grid, integrate new modules |
| `src/components/dashboard/BusinessExpensesDashboard.tsx` | DELETE/REPLACE | Replace with new CashFlowWidget |
| `src/components/ops/OperationCodesPanel.tsx` | CREATE | New codes/rules sidebar component |
| `src/components/ops/QuarterlyGoalsCard.tsx` | CREATE | New goals progress card |
| `src/components/ops/CashFlowWidget.tsx` | CREATE | Condensed spending widget with donut |
| `src/index.css` | MODIFY | Add industrial/pro-tools aesthetic classes |
| Database migration | CREATE | Add `operation_codes` and `quarterly_goals` tables with RLS |

---

### Technical Implementation

#### Phase 1: Database Setup
Create two new tables with RLS policies for user-specific data:
- `operation_codes` - stores the immutable project rules
- `quarterly_goals` - stores quarterly targets with progress

#### Phase 2: New Components

**OperationCodesPanel.tsx**
```tsx
// Key features:
// - Fetch codes from database on mount
// - Render as checklist with styled checkboxes
// - Toggle completion status on click
// - Inline "Add Rule" input at bottom
// - Order by order_index ascending
```

**QuarterlyGoalsCard.tsx**
```tsx
// Key features:
// - Display current quarter's goals
// - Progress bars with percentage labels
// - Click to increment current_value
// - Color coding: green (>75%), amber (50-75%), red (<50%)
```

**CashFlowWidget.tsx**
```tsx
// Key features:
// - Small donut chart (recharts PieChart with innerRadius)
// - 30-day total in center of donut
// - Vertical category list (top 5) on right
// - Clickable categories filter the expense table
```

#### Phase 3: Layout Restructure
Transform BusinessExpenses.tsx to use CSS Grid:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
  {/* Left Sidebar */}
  <div className="space-y-4">
    <OperationCodesPanel />
    <BusinessQuickBooksIntegration />
  </div>
  
  {/* Main Content */}
  <div className="space-y-4">
    {/* Operations Dashboard */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CashFlowWidget />
      <QuarterlyGoalsCard />
    </div>
    
    {/* Existing integrations (condensed) */}
    <SmartSplitReceiptMatching />
    <BusinessReceiptUpload />
    
    {/* Expense Table */}
    <ExpenseTable />
  </div>
</div>
```

---

### Styling Updates

**New Industrial Aesthetic Classes (index.css):**
```css
.ops-panel {
  @apply bg-black/40 border border-border/50 rounded-sm;
}

.ops-header {
  @apply text-xs uppercase tracking-widest text-muted-foreground 
         border-b border-border/30 pb-2 mb-3;
}

.ops-checkbox {
  @apply h-4 w-4 rounded-sm border-2 border-muted-foreground/50
         data-[state=checked]:bg-primary data-[state=checked]:border-primary;
}

.progress-industrial {
  @apply h-2 bg-muted/50 rounded-none;
}

.progress-industrial-fill {
  @apply bg-gradient-to-r from-primary/80 to-primary rounded-none;
}
```

**Color Scheme Reinforcement:**
- Background: Keep existing `--background: 220 20% 10%`
- Borders: Reduce to `border-border/30` for subtle separation
- Text: High contrast white/orange pairing
- Accents: Primary orange for progress, green for completed states

---

### Database Migration

```sql
-- Create operation_codes table
CREATE TABLE IF NOT EXISTS public.operation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quarterly_goals table
CREATE TABLE IF NOT EXISTS public.quarterly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  quarter TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.operation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operation_codes
CREATE POLICY "Users can view own codes" ON public.operation_codes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own codes" ON public.operation_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codes" ON public.operation_codes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own codes" ON public.operation_codes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for quarterly_goals
CREATE POLICY "Users can view own goals" ON public.quarterly_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.quarterly_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.quarterly_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.quarterly_goals
  FOR DELETE USING (auth.uid() = user_id);
```

---

### Implementation Order

1. **Database First** - Create tables and RLS policies
2. **Create OperationCodesPanel** - Sidebar checklist component
3. **Create QuarterlyGoalsCard** - Progress tracking component
4. **Create CashFlowWidget** - Condensed donut + category list
5. **Restructure BusinessExpenses.tsx** - New 2-column grid layout
6. **Apply Industrial Styling** - Update CSS classes throughout
7. **Seed Default Data** - Auto-populate codes and sample goals on first load

---

### Expected Result
- Professional "Command Center" feel with maximum data density
- Left sidebar with pinnable Operation Codes checklist
- Main area with Cash Flow donut + Goals progress bars
- QuickBooks and Receipt integrations remain accessible but condensed
- Expense ledger retains all filtering/search functionality
- Dark, industrial aesthetic consistent with existing KCS Concepts branding


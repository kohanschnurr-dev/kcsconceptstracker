

## Plan: Compact Dashboard Widgets with Pop-out Details

### Overview
Redesign the BusinessExpenses dashboard section to show 4 equal compact widget boxes (30-Day Spending, Category Breakdown, Goals, Rules) that expand into quick summary pop-outs when clicked.

---

### Current Layout
```text
┌────────────────────────────────────────────────────────────────────┐
│ Dashboard Overview (collapsible)                                   │
├────────────────────────────────┬───────────────────────────────────┤
│ 30-Day Spending               │ Category Breakdown                 │
│ $2,939          $98/day avg    │ ┌──────┬──────┬──────┬──────┐     │
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔   │ │Online│Cont. │Subs. │Lic.  │     │
│ [~~~~~~~~~~~~~sparkline~~~~]   │ │$1,805│$747  │$737  │$250  │     │
└────────────────────────────────┴───────────────────────────────────┘
```

### New Layout
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Command Center                                                           │
├────────────────┬────────────────┬────────────────┬───────────────────────┤
│  SPENDING      │  CATEGORIES    │  GOALS         │  RULES               │
│  $2,939        │  8 categories  │  2/5 active    │  3/6 complete        │
│  [sparkline]   │  [mini donut]  │  [mini bars]   │  [mini checklist]    │
│  ────────────  │  ────────────  │  ────────────  │  ────────────        │
│  Click to view │  Click to view │  Click to view │  Click to view       │
└────────────────┴────────────────┴────────────────┴───────────────────────┘
                        ↓ Click any box ↓
                  ┌──────────────────────────┐
                  │ CATEGORY BREAKDOWN       │
                  │ ─────────────────────    │
                  │ [Full donut chart]       │
                  │ [Category list with $]   │
                  └──────────────────────────┘
```

---

### New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/components/ops/CompactDashboardWidgets.tsx` | Container with 4 compact widgets in a row |
| `src/components/ops/SpendingPopout.tsx` | Pop-out dialog showing full 30-day spending chart |
| `src/components/ops/CategoriesPopout.tsx` | Pop-out dialog showing full category breakdown with donut |
| `src/components/ops/GoalsPopout.tsx` | Pop-out dialog showing quarterly goals with progress bars |
| `src/components/ops/RulesPopout.tsx` | Pop-out dialog showing operation codes checklist |

---

### Component Details

#### 1. CompactDashboardWidgets.tsx (Main Container)
- Replaces the current `BusinessExpensesDashboard` component
- 4-column grid layout: `grid-cols-4` on desktop, `grid-cols-2` on mobile
- Each widget is a clickable card that opens its respective pop-out

#### 2. Individual Compact Widget Cards
Each widget shows:
- **Icon** (small, top-left)
- **Title** (e.g., "Spending", "Goals")
- **Key metric** (e.g., "$2,939", "2/5 active")
- **Mini visualization** (sparkline, tiny progress bars, or mini icons)
- Click opens the pop-out dialog

#### 3. Pop-out Dialogs (Quick Summary - Read-Only)
Each pop-out shows:
- **Title header**
- **Full visualization** (larger chart/list)
- **Summary data** (read-only)
- **Close button**

---

### Widget Specifications

| Widget | Compact View | Pop-out Content |
|--------|--------------|-----------------|
| **Spending** | 30-day total + mini sparkline | Full 30-day area chart, daily average, trend |
| **Categories** | Category count + mini donut slice | Full donut chart + scrollable category list with amounts |
| **Goals** | Active goals count + progress indicator | Progress bars for each goal with %, targets, current values |
| **Rules** | Completed/total count + checkmarks | Full checklist - Order of Operations + Vendor Requirements |

---

### Goals Widget Data

Uses the existing `quarterly_goals` table:
- Fetches goals for current quarter (Q1 2026)
- Shows Financial Goals (dollar targets) and Task Completion Goals (count targets)
- Display format: progress bar + "X of Y" label
- Color coding: green (>75%), amber (50-75%), red (<50%)

**Example Goals:**
- "Generate $50K profit" - Financial
- "Close 3 Flips" - Task Completion

---

### Rules Widget Data

Uses the existing `operation_codes` table:
- Fetches all user's operation codes
- Groups by category: "Order of Operations" and "Vendor Requirements"
- Display format: checkbox list with completion status
- Shows completed count / total count in compact view

**Example Rules:**
- Order of Operations: "Foundation First", "Pre-Sheetrock HVAC Inspection"
- Vendor Requirements: "Must have insurance", "COI required"

---

### Technical Implementation

#### File Changes

| File | Action |
|------|--------|
| `src/components/ops/CompactDashboardWidgets.tsx` | CREATE |
| `src/components/ops/SpendingPopout.tsx` | CREATE |
| `src/components/ops/CategoriesPopout.tsx` | CREATE |
| `src/components/ops/GoalsPopout.tsx` | CREATE |
| `src/components/ops/RulesPopout.tsx` | CREATE |
| `src/pages/BusinessExpenses.tsx` | MODIFY - Replace BusinessExpensesDashboard with new component |
| `src/components/dashboard/BusinessExpensesDashboard.tsx` | DELETE (no longer needed) |

#### Data Flow

```text
BusinessExpenses.tsx
    │
    ├── Fetches expenses (existing)
    ├── Fetches goals (new - from quarterly_goals)
    ├── Fetches rules (new - from operation_codes)
    │
    └── <CompactDashboardWidgets
            expenses={expenses}
            goals={goals}
            rules={rules}
            getCategoryLabel={getCategoryLabel}
            onCategoryClick={onCategoryClick}
            selectedCategory={selectedCategory}
        />
            │
            ├── [Spending Card] → onClick → <SpendingPopout />
            ├── [Categories Card] → onClick → <CategoriesPopout />
            ├── [Goals Card] → onClick → <GoalsPopout />
            └── [Rules Card] → onClick → <RulesPopout />
```

---

### Styling

All widgets follow the existing KCS Concepts aesthetic:
- Dark backgrounds (`bg-black/40`, `bg-muted/20`)
- Orange accents for active states
- Subtle borders (`border-border/30`)
- High contrast text
- Sharp corners consistent with existing cards

Compact card styling:
```css
/* Each widget card */
h-[100px] /* Fixed height for equal sizing */
p-3 /* Compact padding */
cursor-pointer
hover:border-primary/50
hover:bg-primary/5
transition-all
```

Pop-out dialog styling:
```css
/* Dialog content */
max-w-md /* Medium size modal */
bg-card
border-border/50
```

---

### Default Data Seeding

On first load, if no goals or rules exist, seed with defaults:

**Default Goals (Q1 2026):**
1. "Generate $50K profit" - target: 50000, current: 0
2. "Close 3 Flips" - target: 3, current: 0
3. "Underwrite 10 Deals" - target: 10, current: 0

**Default Rules:**

Order of Operations:
1. "Foundation First"
2. "Structural Complete Before Finish"
3. "Pre-Sheetrock HVAC Inspection"
4. "Electrical Before Drywall"

Vendor Requirements:
1. "Must Have Insurance"
2. "COI Required"

---

### Implementation Order

1. Create the `src/components/ops/` directory
2. Create `CompactDashboardWidgets.tsx` with the 4-widget grid
3. Create pop-out dialog components (SpendingPopout, CategoriesPopout, GoalsPopout, RulesPopout)
4. Update `BusinessExpenses.tsx` to:
   - Fetch goals and rules from database
   - Seed default data if empty
   - Replace `BusinessExpensesDashboard` with new `CompactDashboardWidgets`
5. Delete the old `BusinessExpensesDashboard.tsx` component


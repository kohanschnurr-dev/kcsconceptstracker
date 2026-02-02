

## Plan: Redesign Budget Calculator into a Rehab-First Project Dashboard

### Problem

The current Budget Calculator page treats budget creation as a secondary action (a floating button that opens a modal), while the "Deal Analysis" tools take up most of the screen real estate. For a rehab-focused workflow, the budget creation and management should be the primary workspace, with deal analysis serving as a supporting tool.

---

### Solution Overview

Transform the page from a deal calculator with a budget button into a **project-centric budgeting dashboard** with three key areas:

1. **Primary Workspace (Left 70%)** - Active Budgeting Canvas with live category cards
2. **Control Sidebar (Right 30%)** - Deal parameters (ARV, Purchase Price) that feed into calculations
3. **Sticky MAO Gauge** - Real-time 78% Rule feedback as budgets change

---

### New Layout Architecture

```text
+----------------------------------------------------------+
| Budget Calculator                    [Template: ▼ Select] |
| Build and manage rehab budgets                            |
+---------------------------+------------------------------+
| [MAO Gauge] Target: $X   |  Current Budget: $Y  |  Δ $Z  |
+---------------------------+------------------------------+
|                           |                              |
|  ACTIVE BUDGETING CANVAS  |  DEAL PARAMETERS             |
|  +-----+ +-----+ +-----+  |  +------------------------+  |
|  |Demo | |Frame| |Elec |  |  | Purchase Price         |  |
|  |$X   | |$X   | |$X   |  |  | ARV                    |  |
|  +-----+ +-----+ +-----+  |  +------------------------+  |
|  +-----+ +-----+ +-----+  |                              |
|  |Plumb| |HVAC | |Paint|  |  SAVED BUDGETS               |
|  |$X   | |$X   | |$X   |  |  [Template cards in drawer]  |
|  +-----+ +-----+ +-----+  |                              |
|  [+ Add Category]         |                              |
|                           +------------------------------+
|  PROFIT SUMMARY           |                              |
|  (collapsed by default)   |                              |
+---------------------------+------------------------------+
```

---

### Technical Changes

#### File: `src/pages/BudgetCalculator.tsx` (Complete Redesign)

**1. New State Management**
- Add inline category editing (no modal for budget entry)
- Track active budget categories with live totals
- Sync with selected template when loading

**2. New Component Structure**

| Section | Description |
|---------|-------------|
| **MAO Status Bar** | Sticky header showing Max Allowable Offer vs Current Budget with visual gauge |
| **Budget Canvas** | Grid of category cards (Demolition, Framing, MEPs, Finishes) with inline dollar inputs |
| **Template Selector** | Dropdown in header to load preset templates ("Standard Rental Refresh", "Full Gut Flip") |
| **Deal Sidebar** | Collapsible right panel with Purchase Price, ARV, and saved budget drawer |
| **Profit Summary** | Collapsed accordion at bottom with full breakdown (existing content) |

**3. UI Component Changes**

| Current | New |
|---------|-----|
| Hero card with "Create" button | Template selector + inline category grid |
| Modal-based budget entry | Direct inline editing on category cards |
| Deal Analysis as main content | Deal inputs in collapsible sidebar |
| SavedBudgetsPanel as card | Drawer/tab inside sidebar |
| Profit breakdown always visible | Collapsible accordion (secondary) |

---

### New Components to Create

#### `src/components/budget/BudgetCategoryCard.tsx`
A compact card for each budget category with:
- Category icon (trade-specific)
- Category name
- Inline dollar input
- Visual budget bar (when applied to project)

#### `src/components/budget/MAOGauge.tsx`
A sticky header widget showing:
- Max Allowable Offer (78% rule calculation)
- Current total budget
- Delta (over/under MAO)
- Color-coded status (green/amber/red)

#### `src/components/budget/TemplatePicker.tsx`
A command bar/dropdown for:
- Preset templates (Standard Rental Refresh, Full Gut Flip, Cosmetic Update)
- Saved user templates
- "Blank Canvas" option

---

### Category Card Layout

Categories will be organized into logical trade groups:

| Group | Categories |
|-------|------------|
| **Structure** | Demolition, Framing, Foundation, Roofing |
| **MEPs** | Electrical, Plumbing, HVAC, Natural Gas |
| **Finishes** | Flooring, Painting, Drywall, Tile |
| **Kitchen/Bath** | Cabinets, Countertops, Appliances, Bathroom |
| **Exterior** | Landscaping, Fencing, Driveway, Windows |
| **Other** | Permits, Dumpsters, Staging, Misc |

---

### Visual Styling

| Element | Style |
|---------|-------|
| **MAO Gauge background** | Amber/Orange gradient for high-contrast visibility |
| **Category cards** | Dark card with subtle border, hover state |
| **Input fields** | Mono font, right-aligned dollar values |
| **Over-budget indicators** | Destructive red accent |
| **Under-budget indicators** | Green-500 accent |
| **Sidebar** | Muted background, collapsible on mobile |

---

### Interaction Flow

1. User lands on page → Sees empty budget canvas with template selector
2. User selects template OR starts from blank
3. Category cards appear in grid → User adjusts dollar amounts inline
4. MAO gauge updates in real-time as values change
5. User can save to folder OR apply to project via sidebar actions
6. Deal parameters (ARV, Purchase Price) in sidebar feed the MAO calculation
7. Profit breakdown available in collapsed accordion for detailed analysis

---

### Files to Modify/Create

| File | Action |
|------|--------|
| `src/pages/BudgetCalculator.tsx` | Major restructure with new layout |
| `src/components/budget/BudgetCategoryCard.tsx` | New - inline editable category card |
| `src/components/budget/MAOGauge.tsx` | New - sticky MAO status indicator |
| `src/components/budget/TemplatePicker.tsx` | New - template selector command bar |
| `src/components/budget/DealSidebar.tsx` | New - collapsible deal parameters sidebar |

---

### Result

- Budget creation becomes the primary workspace activity (not hidden in a modal)
- Deal parameters serve the budget, not the other way around
- Real-time MAO feedback keeps users aligned with the 78% rule
- Template system enables quick starts with proven budget structures
- Saved budgets accessible but not cluttering the main workspace
- Professional, rehab-first interface that matches the dark theme aesthetic


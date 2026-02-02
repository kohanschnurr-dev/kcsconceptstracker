

## Plan: Redesign Budget Calculator Page to Emphasize Budget Creation

### Problem

The current Budget Calculator page treats the "Create Category Budget" feature as an afterthought - it's just a button floating below the header. The page layout prioritizes the deal analysis calculator (78% rule, profit breakdown) over the core budget creation workflow.

Looking at the current layout:
- Header with title
- A lone "Create Category Budget" button
- Deal Inputs card (left)
- 78% Rule Analysis card (right) 
- Profit Breakdown card (full width)
- Saved Budgets panel (right sidebar)

The budget creation functionality is hidden behind a modal, making it feel secondary to the profit calculations.

---

### Solution

Restructure the page into two distinct sections:

1. **Primary Section: Budget Creation** - A prominent hero-style card at the top that invites users to create budgets, with their saved budgets displayed alongside
2. **Secondary Section: Deal Analysis** - The profit calculator tools moved below as a helpful "bonus" feature

This puts the focus on budget creation while still keeping the useful deal analysis tools accessible.

---

### New Layout Design

```text
+----------------------------------------------------------+
| Budget Calculator                                         |
| Create and manage project budgets                         |
+----------------------------------------------------------+
|                                                          |
| +------------------------+  +---------------------------+|
| |  CREATE NEW BUDGET     |  |    SAVED BUDGETS          ||
| |  +-----------------+   |  |    [template cards...]    ||
| |  | Large CTA Card  |   |  |                           ||
| |  | with icon &     |   |  |                           ||
| |  | description     |   |  |                           ||
| |  +-----------------+   |  |                           ||
| +------------------------+  +---------------------------+|
|                                                          |
+----------------------------------------------------------+
|                                                          |
| DEAL ANALYSIS (collapsible or secondary emphasis)        |
| +---------------+  +------------------------------------+|
| | Deal Inputs   |  | 78% Rule Analysis                  ||
| +---------------+  +------------------------------------+|
| +-------------------------------------------------------+|
| | Profit Breakdown                                       ||
| +-------------------------------------------------------+|
+----------------------------------------------------------+
```

---

### Technical Changes

**File: `src/pages/BudgetCalculator.tsx`**

1. **Update Header**
   - Change subtitle to focus on budget creation
   - Remove standalone button

2. **Create Hero Budget Card (new section)**
   - Large card with ClipboardList icon
   - Title: "Create New Budget"
   - Description explaining the workflow
   - Prominent "Create Budget" button inside

3. **Reorganize Layout**
   - Top row: Hero Budget Card (left 2/3) + Saved Budgets (right 1/3)
   - Below: Deal Analysis section with optional collapse/accordion

4. **Make Deal Analysis Secondary**
   - Add a subtle section header "Deal Analysis Tools"
   - Slightly muted styling to de-emphasize
   - Or wrap in a collapsible accordion (optional)

---

### Visual Improvements

| Element | Current | New |
|---------|---------|-----|
| Header subtitle | "Analyze potential deals with profit projections" | "Create and manage category budgets for your projects" |
| Create button | Small button below header | Large hero card with prominent CTA |
| Layout emphasis | Deal analysis is primary | Budget creation is primary |
| Saved Budgets | Right sidebar at bottom | Elevated to top row alongside hero |
| Deal Analysis | Takes up most of page | Moved to secondary section below |

---

### Files to Modify

| File | Action |
|------|--------|
| `src/pages/BudgetCalculator.tsx` | Restructure layout with hero budget card, move deal analysis to secondary section |

---

### Result

- Budget creation becomes the clear primary focus of the page
- Saved budgets are immediately visible alongside the creation CTA
- Deal analysis tools remain accessible but don't overshadow the core feature
- Page feels more intentional and purpose-driven


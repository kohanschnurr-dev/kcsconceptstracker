
## Plan: Move Daily Logs Below Expenses in Navigation

### Overview
Reorder the navigation items in the sidebar and mobile navigation to place "Daily Logs" below "Expenses".

### Current Order
1. Dashboard
2. Daily Logs
3. Projects
4. Calendar
5. Expenses
6. Budget Calculator
7. Procurement
8. Vendors
9. KCS Concepts

### New Order
1. Dashboard
2. Projects
3. Calendar
4. Expenses
5. Daily Logs
6. Budget Calculator
7. Procurement
8. Vendors
9. KCS Concepts

### Files to Update

**1. `src/components/layout/Sidebar.tsx`**
- Reorder the `navItems` array to move Daily Logs after Expenses

**2. `src/components/layout/MobileNav.tsx`**
- Reorder the `navItems` array to match the sidebar order

### Technical Details
Both files contain a `navItems` array that defines the navigation order. Simply reordering the objects in these arrays will update the navigation display.

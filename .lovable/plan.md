
## Reorder Sidebar Navigation

Reordering the navigation items in both the desktop sidebar and mobile navigation to match the requested order.

### Requested Order
1. Dashboard
2. Daily Logs
3. Projects
4. Calendar
5. Expenses
6. Budget Calculator
7. Procurement
8. Vendors
9. KCS Concepts

### Current Order (Sidebar.tsx)
1. Dashboard
2. Projects
3. Calendar
4. Expenses
5. KCS Concepts
6. Vendors
7. Procurement
8. Daily Logs
9. Budget Calculator

---

## Files to Update

### 1. Desktop Sidebar
**File: `src/components/layout/Sidebar.tsx`** (lines 19-29)

Reorder the `navItems` array:
```tsx
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', exact: true },
  { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
  { icon: ShoppingCart, label: 'Procurement', path: '/procurement', matchPaths: ['/procurement', '/bundles'] },
  { icon: Users, label: 'Vendors', path: '/vendors' },
  { icon: Briefcase, label: 'KCS Concepts', path: '/business-expenses' },
];
```

### 2. Mobile Navigation
**File: `src/components/layout/MobileNav.tsx`** (lines 21-30)

Update to match and add the missing Calendar item:
```tsx
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
  { icon: ShoppingCart, label: 'Procurement', path: '/procurement' },
  { icon: Users, label: 'Vendors', path: '/vendors' },
  { icon: Briefcase, label: 'KCS Concepts', path: '/business-expenses' },
];
```

Also need to add the `CalendarDays` import to MobileNav.tsx.

---

## Summary

| File | Change |
|------|--------|
| `Sidebar.tsx` | Reorder navItems array to new order |
| `MobileNav.tsx` | Add CalendarDays import, reorder navItems to match |

Both navigation menus will be consistent with the new order.

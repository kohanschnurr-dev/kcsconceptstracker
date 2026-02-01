
## Plan: Fix Navigation Item to Use Dynamic Company Name

### Problem
The sidebar and mobile navigation show "KCS Concepts" as a hardcoded navigation item label (line 31 in Sidebar.tsx, line 34 in MobileNav.tsx). The header correctly shows the dynamic company name, but the nav link to business expenses doesn't update.

### Root Cause
The `navItems` array is a static constant defined outside the component, so it cannot access the `companyName` from the `useCompanySettings` hook.

### Solution
Dynamically build the nav items inside the component so the Business Expenses link uses the dynamic company name.

### Changes

#### 1. Sidebar.tsx

Move the navItems array inside the component and replace the hardcoded label:

```tsx
export function Sidebar() {
  const { companyName, logoUrl } = useCompanySettings();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', exact: true },
    { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
    { icon: Receipt, label: 'Expenses', path: '/expenses' },
    { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
    { icon: ShoppingCart, label: 'Procurement', path: '/procurement', matchPaths: ['/procurement', '/bundles'] },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: Briefcase, label: companyName, path: '/business-expenses' },
  ];
  // ... rest of component
}
```

#### 2. MobileNav.tsx

Same approach - move navItems inside component:

```tsx
export function MobileNav() {
  const { companyName, logoUrl } = useCompanySettings();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
    { icon: Receipt, label: 'Expenses', path: '/expenses' },
    { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
    { icon: ShoppingCart, label: 'Procurement', path: '/procurement' },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: Briefcase, label: companyName, path: '/business-expenses' },
  ];
  // ... rest of component
}
```

### Result

| Location | Before | After |
|----------|--------|-------|
| Sidebar nav link | "KCS Concepts" | Uses dynamic company name (e.g., "Testt") |
| Mobile nav link | "KCS Concepts" | Uses dynamic company name (e.g., "Testt") |
| Business Expenses header | Already dynamic | No change needed |

### Technical Notes
- The `navItems` array must be inside the component to access the hook value
- No memoization needed since React will re-render when `companyName` changes
- The `isActiveLink` helper function can remain outside the component in Sidebar.tsx

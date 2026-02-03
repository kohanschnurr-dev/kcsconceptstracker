

## Plan: Hover-to-Expand Sidebar

### Overview

Transform the sidebar to be collapsed by default (showing only icons and company logo), but expand smoothly when the user hovers over it. This saves screen space while keeping navigation easily accessible.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Add hover state, collapsed/expanded styles, hide text when collapsed |
| `src/components/layout/MainLayout.tsx` | Reduce left margin to match collapsed sidebar width |

---

### Technical Details

**File: `src/components/layout/Sidebar.tsx`**

#### 1. Add hover state

```tsx
import { useState } from 'react';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  // ... existing code
```

#### 2. Update aside element with hover handlers and dynamic width

```tsx
<aside 
  className={cn(
    "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
    isExpanded ? "w-64" : "w-16"
  )}
  onMouseEnter={() => setIsExpanded(true)}
  onMouseLeave={() => setIsExpanded(false)}
>
```

#### 3. Update logo section (hide company name when collapsed)

```tsx
<div className={cn(
  "flex h-16 items-center border-b border-border",
  isExpanded ? "gap-3 px-4" : "justify-center px-2"
)}>
  <img 
    src={logoUrl || kcsLogo} 
    alt={companyName} 
    className="h-10 w-10 object-contain flex-shrink-0" 
  />
  {isExpanded && (
    <h1 className="font-bold text-foreground text-lg truncate">{companyName}</h1>
  )}
</div>
```

#### 4. Update navigation items (hide labels when collapsed)

```tsx
<nav className={cn("flex-1 space-y-1", isExpanded ? "p-4" : "p-2")}>
  {navItems.map((item) => {
    const isActive = isActiveLink(item, location.pathname);
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          'flex items-center rounded-lg text-sm font-medium transition-colors',
          isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        title={!isExpanded ? item.label : undefined}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        {isExpanded && <span>{item.label}</span>}
      </NavLink>
    );
  })}
</nav>
```

#### 5. Update footer section

```tsx
<div className={cn("border-t border-border space-y-2", isExpanded ? "p-4" : "p-2")}>
  {user && isExpanded && (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-xs text-muted-foreground truncate">{displayName || user.email}</span>
      <NavLink
        to="/settings"
        className={cn(
          'p-1.5 rounded-md transition-colors',
          location.pathname === '/settings'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Settings className="h-4 w-4" />
      </NavLink>
    </div>
  )}
  {!isExpanded && user && (
    <NavLink
      to="/settings"
      className={cn(
        'flex justify-center p-2.5 rounded-lg transition-colors',
        location.pathname === '/settings'
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
      title="Settings"
    >
      <Settings className="h-5 w-5" />
    </NavLink>
  )}
  <Button
    variant="ghost"
    className={cn(
      "w-full text-muted-foreground hover:text-foreground",
      isExpanded ? "justify-start gap-3" : "justify-center p-2.5"
    )}
    onClick={signOut}
    title={!isExpanded ? "Sign Out" : undefined}
  >
    <LogOut className="h-5 w-5" />
    {isExpanded && <span>Sign Out</span>}
  </Button>
</div>
```

---

**File: `src/components/layout/MainLayout.tsx`**

#### Update main content margin

```tsx
{/* Main Content */}
<main className="lg:ml-16">
  <div className="min-h-screen p-4 pt-20 pb-24 lg:p-8 lg:pt-8 lg:pb-8">
    {children}
  </div>
</main>
```

---

### Visual Result

**Collapsed (Default):**
```
┌────┐
│ 🏠 │  <- Company logo only
├────┤
│ 🏠 │  <- Dashboard icon
│ 📁 │  <- Projects icon
│ 📅 │  <- Calendar icon
│ 🧾 │  <- Expenses icon
│ 📋 │  <- Daily Logs icon
│ 🧮 │  <- Calculator icon
│ 🛒 │  <- Procurement icon
│ 👥 │  <- Vendors icon
│ 💼 │  <- Business icon
├────┤
│ ⚙️ │  <- Settings icon
│ 🚪 │  <- Sign Out icon
└────┘
```

**Expanded (On Hover):**
```
┌──────────────────────────┐
│ 🏠 KCS Concepts          │
├──────────────────────────┤
│ 🏠 Dashboard             │
│ 📁 Projects              │
│ 📅 Calendar              │
│ 🧾 Expenses              │
│ 📋 Daily Logs            │
│ 🧮 Budget Calculator     │
│ 🛒 Procurement           │
│ 👥 Vendors               │
│ 💼 KCS Concepts          │
├──────────────────────────┤
│ user@email.com     ⚙️    │
│ 🚪 Sign Out              │
└──────────────────────────┘
```

---

### Behavior

1. **Collapsed by default** - Sidebar shows only icons (64px / w-16)
2. **Hover to expand** - Sidebar smoothly expands to full width (256px / w-64) on mouse enter
3. **Collapse on leave** - Sidebar returns to collapsed state when mouse leaves
4. **Tooltips** - Icons show tooltip with label when collapsed (via `title` attribute)
5. **Smooth transition** - 300ms ease-in-out animation for width changes

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Sidebar.tsx` | Add hover state, conditional rendering for collapsed/expanded |
| `src/components/layout/MainLayout.tsx` | Change `lg:ml-64` to `lg:ml-16` |




## Plan: Smooth Sidebar Transition

### Problem

The sidebar transition looks choppy because:
- Text labels appear/disappear instantly (conditional rendering)
- Layout properties (padding, gap) change abruptly
- No overflow control during the width animation

### Solution

Apply smooth transitions to all changing properties and use opacity/overflow techniques instead of conditional rendering.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Add overflow hidden, smooth opacity transitions, and consistent layout |

---

### Technical Details

**Key improvements:**

1. **Add `overflow-hidden`** to the aside to clip content during transition
2. **Always render text labels** but animate their opacity and width instead of conditional rendering
3. **Use consistent padding** and animate the container width only
4. **Add `whitespace-nowrap`** to prevent text wrapping during transition

**Code changes:**

#### 1. Update aside wrapper

```tsx
<aside 
  className={cn(
    "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar overflow-hidden transition-all duration-300 ease-in-out",
    isExpanded ? "w-64" : "w-16"
  )}
  onMouseEnter={() => setIsExpanded(true)}
  onMouseLeave={() => setIsExpanded(false)}
>
```

#### 2. Update logo section - always render text with opacity transition

```tsx
<div className="flex h-16 items-center gap-3 border-b border-border px-4">
  <img 
    src={logoUrl || kcsLogo} 
    alt={companyName} 
    className="h-10 w-10 object-contain flex-shrink-0" 
  />
  <h1 className={cn(
    "font-bold text-foreground text-lg whitespace-nowrap transition-opacity duration-300",
    isExpanded ? "opacity-100" : "opacity-0"
  )}>{companyName}</h1>
</div>
```

#### 3. Update navigation items - always render labels with opacity

```tsx
<nav className="flex-1 space-y-1 p-2">
  {navItems.map((item) => {
    const isActive = isActiveLink(item, location.pathname);
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        title={!isExpanded ? item.label : undefined}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span className={cn(
          "whitespace-nowrap transition-opacity duration-300",
          isExpanded ? "opacity-100" : "opacity-0"
        )}>{item.label}</span>
      </NavLink>
    );
  })}
</nav>
```

#### 4. Update footer section

```tsx
<div className="border-t border-border space-y-2 p-2">
  {user && (
    <div className={cn(
      "flex items-center justify-between px-3 py-2 transition-opacity duration-300",
      isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
    )}>
      <span className="text-xs text-muted-foreground truncate whitespace-nowrap">{displayName || user.email}</span>
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
    className="w-full justify-start gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground"
    onClick={signOut}
    title={!isExpanded ? "Sign Out" : undefined}
  >
    <LogOut className="h-5 w-5 flex-shrink-0" />
    <span className={cn(
      "whitespace-nowrap transition-opacity duration-300",
      isExpanded ? "opacity-100" : "opacity-0"
    )}>Sign Out</span>
  </Button>
</div>
```

---

### How It Works

1. **Width transition** - The sidebar smoothly animates between 64px (w-16) and 256px (w-64)
2. **Overflow hidden** - Content outside the sidebar width is clipped, preventing visual overflow
3. **Opacity fade** - Text labels fade in/out smoothly instead of popping in/out
4. **Consistent layout** - Elements maintain their position (gap, padding) throughout the transition
5. **Whitespace nowrap** - Prevents text from wrapping to multiple lines during transition

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/layout/Sidebar.tsx` | 53-145 | Add overflow-hidden, opacity transitions, and consistent layout |


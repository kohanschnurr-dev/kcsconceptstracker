

## Add Settings Icon and Page

Adding a Settings option to the sidebar footer area (next to Sign Out) with a new Settings page.

---

## Changes Overview

### 1. Create Settings Page
**New File: `src/pages/Settings.tsx`**

Create a new Settings page using the same layout pattern as other pages:
- Uses `MainLayout` wrapper
- Header with title "Settings"
- Initial sections for:
  - Account (email display, password change option)
  - App Preferences (placeholder for future settings)
  - Integrations (QuickBooks connection status)
  - Legal (links to Privacy Policy and EULA)

### 2. Add Settings Route
**File: `src/App.tsx`**

- Import the new Settings page
- Add protected route: `/settings`

### 3. Update Sidebar Footer
**File: `src/components/layout/Sidebar.tsx`**

- Import `Settings` icon from lucide-react
- Add Settings button/link above Sign Out in the footer section
- Style to match the Sign Out button

### 4. Update Mobile Navigation Footer
**File: `src/components/layout/MobileNav.tsx`**

- Import `Settings` icon from lucide-react
- Add Settings link above Sign Out in the mobile menu footer
- Close sheet when navigating

---

## Visual Layout (Footer Section)

```text
┌────────────────────────────┐
│ kohanschnurr@gmail.com     │
├────────────────────────────┤
│ ⚙️  Settings               │  ← NEW
│ ↪️  Sign Out                │
└────────────────────────────┘
```

---

## Technical Details

### Sidebar.tsx Changes (lines 83-90)
```tsx
// Add before Sign Out button
<NavLink
  to="/settings"
  className={cn(
    'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
    location.pathname === '/settings'
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  )}
>
  <Settings className="h-5 w-5" />
  Settings
</NavLink>
```

### Settings Page Structure
- Account section with user email and change password option
- App Preferences section (placeholder for dark mode, notifications, etc.)
- Integrations section showing QuickBooks connection status
- Legal section with links to Privacy Policy and EULA

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Settings.tsx` | Create | New Settings page with account, preferences, integrations sections |
| `src/App.tsx` | Edit | Add Settings route and import |
| `src/components/layout/Sidebar.tsx` | Edit | Add Settings icon and link in footer |
| `src/components/layout/MobileNav.tsx` | Edit | Add Settings link in mobile menu footer |


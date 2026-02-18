
## Update Mobile Menu: Settings & Notifications — Match Sidebar Pattern

### Problem

The mobile "Menu" sheet (`MobileNav.tsx`) has an inconsistent footer compared to the desktop sidebar:

| | Desktop Sidebar | Mobile Menu (current) |
|---|---|---|
| Username | Small text row | Tiny text + gear icon crammed inline |
| Settings | Full nav row (icon + label) | Hidden as a gear icon next to username |
| Notifications | Full nav row (icon + label + badge) | **Completely absent** |
| Sign Out | Full nav row | Full nav row ✓ |

The screenshot confirms it: the mobile footer shows `Kohan Schnurr` with a settings gear jammed to the right — no Notifications row at all.

### Fix

Rewrite the footer section of `MobileNav.tsx` to exactly mirror the sidebar's footer rows:

1. **Username row** — standalone text-only row (same as sidebar's expanded state)
2. **Settings row** — full `NavLink` row: icon + "Settings" label, active highlight
3. **Notifications row** — full `button` row: bell icon + "Notifications" label + unread badge (owners only), opens `NotificationsPanel`
4. **Sign Out row** — existing full row, unchanged

### Technical Changes

**File:** `src/components/layout/MobileNav.tsx`

**Imports to add:**
- `Bell` from `lucide-react`
- `useNotifications` from `@/hooks/useNotifications`
- `NotificationsPanel` from `@/components/layout/NotificationsPanel`
- Remove `Settings` from nav footer (it becomes its own row, same import but used differently)

**New state:**
```tsx
const [notifOpen, setNotifOpen] = useState(false);
```

**Hook:**
```tsx
const { unreadCount, isOwner } = useNotifications();
```

**New footer block (replaces lines 88–114):**
```tsx
<div className="border-t border-border p-2 space-y-1">
  {/* Username */}
  {user && (
    <div className="px-3 py-1.5">
      <span className="text-xs text-muted-foreground truncate block">
        {displayName || user.email}
      </span>
    </div>
  )}

  {/* Settings — full row */}
  <NavLink
    to="/settings"
    onClick={() => setOpen(false)}
    className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      location.pathname === '/settings'
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    )}
  >
    <Settings className="h-5 w-5" />
    Settings
  </NavLink>

  {/* Notifications — owners only, full row with badge */}
  {isOwner && (
    <button
      onClick={() => { setOpen(false); setNotifOpen(true); }}
      className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <span className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      <span className="flex flex-1 items-center justify-between">
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold px-1.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
    </button>
  )}

  {/* Sign Out */}
  <button
    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
    onClick={handleSignOut}
  >
    <LogOut className="h-5 w-5" />
    Sign Out
  </button>
</div>
```

**After the `</Sheet>` closing tag, render the panel:**
```tsx
<NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
```

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/MobileNav.tsx` | Add `Bell` import, `useNotifications` hook, `notifOpen` state, `NotificationsPanel` import. Rewrite footer block: username row → Settings full row → Notifications full row (owners only, with badge) → Sign Out. Render `NotificationsPanel` alongside the menu `Sheet`. |

No other files needed — `NotificationsPanel` and `useNotifications` already exist and work correctly.

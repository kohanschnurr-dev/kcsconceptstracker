
## Make Settings Match Bell & Sign Out Style

### What's Happening Now

The sidebar footer currently has two distinct behaviors for Settings:

- **Expanded**: Settings gear icon appears as a small icon button floated to the right of the username (`Kohan Schnurr  ⚙`), inside a flex row
- **Collapsed**: Settings shows as a centered icon-only `NavLink`

The Bell and Sign Out are full-width rows (`flex items-center gap-3 px-3 py-2.5`) with icon on the left and label that fades in/out — consistent with the nav items above.

### The Fix

Refactor the footer so **all three items** (Settings, Notifications bell, Sign Out) follow the same pattern:

1. Remove the split "username row with gear icon" layout entirely
2. Move the username display to its own separate row above the three action rows — just text, full-width, fades in when expanded
3. Make Settings a full-width `NavLink` row styled identically to the Bell button and Sign Out button:
   - `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full`
   - `Settings` icon on the left (`h-5 w-5 flex-shrink-0`)
   - "Settings" label text that fades with `transition-opacity` (same as nav items and Sign Out)
   - Active state: `bg-primary/10 text-primary` when on `/settings`
   - No separate collapsed-only icon — the same row works in both states (label just becomes invisible)

### Final Footer Layout (Expanded State)

```text
┌──────────────────────────────┐
│  Kohan Schnurr               │  ← username, fades when expanded only
│  ⚙  Settings                 │  ← same style as bell/sign out
│  🔔 Notifications       (3)  │  ← existing (no change)
│  ↪  Sign Out                 │  ← existing (no change)
└──────────────────────────────┘
```

### Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Replace the dual Settings logic (collapsed icon + expanded inline gear) with a single unified full-width row, and move username to its own standalone row above it |

### Specific Code Changes in `Sidebar.tsx`

**Remove** (lines ~109–141):
- The `isExpanded` conditional `div` that contains the username + inline Settings gear
- The `!isExpanded` conditional `NavLink` for the collapsed Settings icon

**Add**:
1. Username-only row — shown when expanded, hidden when not (just like the current behavior, but no gear attached):
   ```tsx
   {user && (
     <div className={cn(
       "px-3 py-1 transition-opacity duration-300",
       isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden py-0"
     )}>
       <span className="text-xs text-muted-foreground truncate block">{displayName || user.email}</span>
     </div>
   )}
   ```
2. Settings row matching Bell/Sign Out style:
   ```tsx
   <NavLink
     to="/settings"
     className={cn(
       'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-colors',
       location.pathname === '/settings'
         ? 'bg-primary/10 text-primary'
         : 'text-muted-foreground hover:bg-muted hover:text-foreground'
     )}
     title={!isExpanded ? "Settings" : undefined}
   >
     <Settings className="h-5 w-5 flex-shrink-0" />
     <span className={cn(
       "whitespace-nowrap transition-opacity duration-300",
       isExpanded ? "opacity-100" : "opacity-0"
     )}>Settings</span>
   </NavLink>
   ```

This is a surgical, low-risk change to one file — purely cosmetic/layout, no logic changes.

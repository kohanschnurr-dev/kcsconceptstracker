
## Notification Preferences Settings Card

### What's Being Built

A new "Notification Preferences" card on the Settings page that lets the owner control which event types show up in their in-app notification bell. Since mobile push isn't wired to a native push service yet, the toggle will cover "In-App Notifications" per event type (the UI can be designed to extend to push later without any rework — just add a second column of toggles).

The user's concern: getting flooded with `expense` and `daily_log` notifications. Solution: per-event-type toggles so they can silence the noisy ones while keeping the important ones (order requests, messages, project status changes).

---

### Architecture

**Storage**: Preferences stored in `localStorage` under key `notification-preferences` and synced to the cloud via the existing `useSettingsSync` mechanism (same pattern as `dashboard-profit-filters`). The key gets added to the `SETTINGS_KEYS` array so it auto-syncs across devices.

**Filtering**: The `useNotifications` hook gets a small update to read from `localStorage` and filter out suppressed event types before returning the `notifications` array to consumers. This means suppressed types won't appear in the panel and won't count toward the unread badge — exactly what the user wants.

**No DB changes needed** — preferences are user-controlled UI config, not server state.

---

### Event Types and Default Config

All 8 event types from `Notification['event_type']`, all ON by default:

| Event Type | Label | Default |
|---|---|---|
| `order_request` | Order Requests | ✅ On |
| `expense` | Expenses | ✅ On |
| `daily_log` | Daily Logs | ✅ On |
| `task_completed` | Task Completions | ✅ On |
| `project_note` | Project Notes | ✅ On |
| `project_created` | New Projects | ✅ On |
| `project_status` | Status Changes | ✅ On |
| `direct_message` | Direct Messages | ✅ On |

Users can toggle off `expense` and `daily_log` to stop the noise.

---

### New File: `src/components/settings/NotificationPreferencesCard.tsx`

A Card component matching the style of `DashboardPreferencesCard`. Structure:

```
┌──────────────────────────────────────────────────────────┐
│ 🔔 Notification Preferences                              │
│ Choose which activity types appear in your notification  │
│ bell. Turned off types are silenced and won't count      │
│ toward your unread badge.                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  In-App Notifications                                    │
│                                                          │
│  [🛒] Order Requests         ————●  (ON)                │
│  [💸] Expenses               ●————  (OFF)               │
│  [📋] Daily Logs             ●————  (OFF)               │
│  [✅] Task Completions       ————●  (ON)                │
│  [📝] Project Notes          ————●  (ON)                │
│  [📁] New Projects           ————●  (ON)                │
│  [🔄] Status Changes         ————●  (ON)                │
│  [💬] Direct Messages        ————●  (ON)                │
│                                                          │
│  [Turn all on]   [Turn all off]                          │
└──────────────────────────────────────────────────────────┘
```

Uses `Switch` component (already exists at `src/components/ui/switch.tsx`) — consistent with other preference cards. Each row shows the coloured icon from `EVENT_META` alongside the label and the toggle.

State is read from/written to `localStorage` on every toggle change + calls `triggerSettingsSync()` to debounce-sync to cloud.

---

### Changes to `src/hooks/useSettingsSync.ts`

Add `'notification-preferences'` to the `SETTINGS_KEYS` array so it auto-syncs across devices on login:

```ts
const SETTINGS_KEYS = [
  // ... existing keys ...
  'notification-preferences',
];
```

---

### Changes to `src/hooks/useNotifications.ts`

Add a utility export `useNotificationPreferences()` that reads from localStorage. Then in `useNotifications`, filter the returned `notifications` array against the prefs before returning:

```ts
export function loadNotificationPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('notification-preferences');
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: all ON
  return {};
}

// Inside useNotifications:
const prefs = loadNotificationPrefs();
const filtered = notifications.filter(n => prefs[n.event_type] !== false);
// use `filtered` for return value
```

This means `unreadCount` also reflects only the types the user cares about.

---

### Changes to `src/pages/Settings.tsx`

Import and render `<NotificationPreferencesCard />` after the `<ManageSourcesCard />` block (before `<ManageRolesCard />`), so it appears in the Manage section logically:

```tsx
import NotificationPreferencesCard from '@/components/settings/NotificationPreferencesCard';

// In JSX, after ManageSourcesCard:
<NotificationPreferencesCard />
```

---

### Files to Create / Modify

| File | Change |
|---|---|
| `src/components/settings/NotificationPreferencesCard.tsx` | **New** — Switch-based UI for 8 event types |
| `src/hooks/useSettingsSync.ts` | Add `notification-preferences` to `SETTINGS_KEYS` |
| `src/hooks/useNotifications.ts` | Filter notifications by prefs before returning |
| `src/pages/Settings.tsx` | Import and render `<NotificationPreferencesCard />` |

---

### Visual Outcome

- Owner turns off `expense` and `daily_log` → those entries are silenced app-wide (no bell badge count, not shown in panel)
- Settings persist across devices via cloud sync
- Easy to re-enable anytime via the card
- `direct_message` is always prominent since it's the most important
- Future mobile push column can be added by duplicating the switch column with a phone icon header — no structural change needed


## Sidebar Notifications — Owner Activity Feed

### Vision
An "away owner" gets a compact bell icon in the sidebar footer (between Settings and Sign Out). When clicked, it opens a slide-in panel — a chronological activity feed of everything their GCs (project managers) have done. Each card shows who did it, when, and links directly to the relevant page. Unread notifications leave a badge count on the bell that persists across sessions.

---

### Trigger Events (all 7)
| Event | Source table | Notification copy |
|---|---|---|
| Order request submitted | `procurement_order_requests` | "**{name}** submitted an order request ({N} items)" |
| Expense logged | `expenses` | "**{name}** logged a ${amount} expense on {project}" |
| Daily log added | `daily_logs` | "**{name}** added a daily log for {project} on {date}" |
| Task completed | `tasks` | "**{name}** completed a task: "{title}"" |
| Project note added | `project_notes` | "**{name}** left a note on {project}" |
| New project created | `projects` | "**{name}** created a new project: {name}" |
| Project status changed | `projects` | "**{name}** changed {project} status to {status}" |
| Direct message to owner | new `owner_messages` table | "**{name}** sent you a message: "{preview}"" |

---

### Architecture Decisions

**Option A — DB trigger-based**: A Postgres trigger on each source table INSERTs into a `notifications` table automatically. Pro: guaranteed capture regardless of which client wrote the data. Con: harder to include display context (project name, PM name) since triggers only see raw column values.

**Option B — App-side write**: When a PM action succeeds (e.g. after `submitOrder.mutateAsync`), the frontend also calls `supabase.from('notifications').insert(...)`. Pro: full context available (names, formatted strings). Con: if the user closes the tab during the mutation, the notification might not fire.

**Decision: DB trigger-based** — more reliable, owner notifications should not depend on the PM staying on the page. Context (project name, member name) is embedded in the `payload` JSONB column at trigger time via a subquery.

---

### Database Changes (1 migration)

**New table: `notifications`**
```sql
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL,          -- the owner who should see this
  actor_id    uuid NOT NULL,          -- the PM who triggered it
  event_type  text NOT NULL,          -- 'order_request' | 'expense' | 'daily_log' | 'task_completed' | 'project_note' | 'project_created' | 'project_status' | 'direct_message'
  entity_id   uuid,                   -- FK to the source row (for navigation)
  payload     jsonb NOT NULL DEFAULT '{}',  -- { actorName, projectName, amount, title, etc. }
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Owner can read and update their own notifications
CREATE POLICY "Owner can view notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can mark notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = owner_id);

-- Service role (triggers) can insert
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
```

**New table: `owner_messages`** (for direct PM → owner messages)
```sql
CREATE TABLE public.owner_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL,
  sender_id   uuid NOT NULL,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_messages ENABLE ROW LEVEL SECURITY;

-- PMs can insert; owner can view all in their team
CREATE POLICY "PMs can send messages" ON public.owner_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Owner can view team messages" ON public.owner_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
  );
CREATE POLICY "Sender can view their own messages" ON public.owner_messages
  FOR SELECT USING (auth.uid() = sender_id);
```

**Postgres triggers** (SECURITY DEFINER functions):
- `fn_notify_order_request()` — fires AFTER INSERT on `procurement_order_requests`
- `fn_notify_expense()` — fires AFTER INSERT on `expenses`
- `fn_notify_daily_log()` — fires AFTER INSERT on `daily_logs`
- `fn_notify_task_completed()` — fires AFTER UPDATE on `tasks` WHERE NEW.status = 'completed' AND OLD.status != 'completed'
- `fn_notify_project_note()` — fires AFTER INSERT on `project_notes`
- `fn_notify_project_created()` — fires AFTER INSERT on `projects`
- `fn_notify_project_status()` — fires AFTER UPDATE on `projects` WHERE NEW.status != OLD.status
- `fn_notify_direct_message()` — fires AFTER INSERT on `owner_messages`

Each trigger function:
1. Looks up the owner via `teams` table (e.g. `get_team_owner_id(NEW.user_id)`)
2. Looks up the actor's profile name
3. Inserts into `notifications` with a pre-built `payload` JSONB

---

### New Files

**`src/hooks/useNotifications.ts`**
- Queries `notifications` WHERE `owner_id = user.id` ORDER BY `created_at DESC` LIMIT 50
- Exposes `notifications`, `unreadCount`, `markRead(id)`, `markAllRead()`
- Uses `staleTime: 0` so it's always fresh (the badge must be accurate)
- Only enabled when `isOwner === true` (saves pointless queries for PMs)

**`src/components/layout/NotificationsPanel.tsx`**
- `Sheet` (slide-in from left, matching sidebar) — opens when bell is clicked
- Header: "Notifications" + "Mark all read" button
- Body: scrollable feed of `NotificationCard` components
- Each card:
  - Left: colored icon by event type (🛒 order, 💰 expense, 📋 log, ✅ task, 📝 note, 📁 project, 💬 message)
  - Bold actor name + short description
  - Relative timestamp ("2h ago")
  - Faint unread dot (blue) on left edge if `is_read = false`
  - Click the card → navigate to relevant route + mark as read

**Navigation routes per event type:**
| Type | Route |
|---|---|
| `order_request` | `/procurement` (opens order panel) |
| `expense` | `/projects/{projectId}` → Expenses tab |
| `daily_log` | `/logs` |
| `task_completed` | `/projects/{projectId}` → Tasks tab |
| `project_note` | `/projects/{projectId}` → Notes tab |
| `project_created` | `/projects/{projectId}` |
| `project_status` | `/projects/{projectId}` |
| `direct_message` | stays in panel (shows full message inline) |

---

### Sidebar Changes (`src/components/layout/Sidebar.tsx`)

Add a bell button to the **footer**, between Settings and Sign Out:
- Only rendered when `isOwner === true`
- Collapsed state: centered bell icon with a red badge dot (e.g. `●` or small number) overlapping it
- Expanded state: `Bell` icon + "Notifications" label + badge pill on right showing unread count
- Clicking opens `NotificationsPanel` as a `Sheet`

```
[ Settings icon ]                  ← existing
[ 🔔 Notifications  (3) ]          ← new, only for owners
[ Sign Out ]                       ← existing
```

---

### Files to Create/Modify

| Action | File |
|---|---|
| Create | `src/hooks/useNotifications.ts` |
| Create | `src/components/layout/NotificationsPanel.tsx` |
| Modify | `src/components/layout/Sidebar.tsx` — add bell button + panel |
| DB Migration | `notifications` table + `owner_messages` table + 8 trigger functions |

---

### Implementation Notes

- **No PM UI changes needed** for most triggers — they're all automatic via DB triggers. The only new PM-facing UI is a small "Message Owner" button that could be added to any project page header (or the Procurement page) to send a direct message.
- **Trigger safety**: each trigger function checks that the actor is NOT the owner themselves (owner actions don't self-notify).
- **No duplicate notifications**: triggers use `ON CONFLICT DO NOTHING` where applicable.
- **Performance**: `notifications` table gets an index on `(owner_id, is_read, created_at DESC)`.
- **staleTime**: `useNotifications` uses 0 staleTime and will refetch on window focus so the badge is never stale.

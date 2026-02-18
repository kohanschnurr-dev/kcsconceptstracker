
## Floating Message Bubble — Bottom-Right Chat Widget

### What's Being Built

A persistent floating action button (FAB) fixed to the bottom-right corner of every page, visible app-wide. It adapts based on who is logged in:

- **Owner view**: Opens a conversation list showing all PMs with their last message + unread count. Clicking a PM opens their full thread (reusing `MessageThreadPanel`).
- **PM view**: Opens the direct conversation with the owner (same UI the PM already has in `MessageOwnerButton`, but now always accessible from anywhere in the app).

The `MessageOwnerButton` on the project header can stay for quick access in context, but the FAB gives global persistent access — especially useful on mobile and across non-project pages.

---

### Visual Design

```
                                    ┌─────────────────────────────┐
                                    │  💬  Team Messages       ✕  │
                                    ├─────────────────────────────┤
                                    │  Jose Martinez          2   │
                                    │  "Hey Kohan, just wrapped…" │
                                    │  10 min ago                 │
                                    ├─────────────────────────────┤
                                    │  Maria Chen                 │
                                    │  "Materials delivered ✓"    │
                                    │  2 hr ago                   │
                                    └─────────────────────────────┘

                                              ┌──────┐
                                              │ 💬 2 │  ← FAB (bottom-right)
                                              └──────┘
```

When a PM is selected from the list → the panel slides to their thread (same `MessageThreadPanel` component already built). Back arrow returns to the list.

For PMs, clicking the FAB opens the thread directly (no list needed — only one owner to talk to).

---

### Architecture

**New component**: `src/components/layout/FloatingMessageBubble.tsx`

This is a self-contained component that:

1. Reads `useIsPM()` to determine role
2. For owners: reads `useTeam()` to get members list, then queries `owner_messages` for the latest message per PM + unread count
3. Shows a floating button with a badge for total unread messages
4. Manages an open/closed popover-style panel (not a Sheet — it grows upward from the button)
5. Has a 2-view stack: `'list'` (all PMs) → `'thread'` (specific PM thread)
6. Reuses `useMessageThread` hook directly for the thread view

**View for Owners**:
- Fetches all `team_members` for their team
- For each member, fetches the latest `owner_messages` row and count of unread (messages sent by the PM where `recipient_id IS NULL` and not yet replied to)
- Shows each PM as a row with avatar initial, name, message preview, time, and unread badge
- Clicking a row opens `MessageThreadPanel` inline in the expanded panel

**View for PMs**:
- Uses `useIsPM()` to get `teamId`
- Calls `fetchPmThread` directly to load the conversation with the owner
- Shows thread immediately when panel opens (no list step needed)

**Unread count badge on FAB**:
- For owners: count of `owner_messages` rows where `recipient_id IS NULL` and the owner has not replied after the latest PM message (approximate — can be done by checking if there's any PM message newer than the latest owner reply)
- Simpler approach: track a `last_seen_at` in localStorage per PM thread, and count messages newer than that timestamp — zero extra DB queries

---

### New Hook: `useTeamMessages.ts` (owner-side summary)

A lightweight hook that fetches a summary of all PM conversations for the owner:

```ts
// For each team member, get:
// - their profile info (name)
// - the last message in their thread
// - count of their messages after the owner's last reply

interface PmThreadSummary {
  pmId: string;
  pmName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
```

Implemented with a single query:
```sql
SELECT * FROM owner_messages
WHERE team_id = ?
ORDER BY created_at DESC
```
Then grouping client-side by sender (PM messages vs owner replies), to compute lastMessage and unread per PM.

Realtime subscription on the `owner_messages` table to auto-update the list when a PM sends a new message.

---

### Files to Create / Modify

| File | Change |
|------|--------|
| `src/hooks/useTeamMessages.ts` | **New** — owner-side summary of all PM thread previews with unread counts |
| `src/components/layout/FloatingMessageBubble.tsx` | **New** — the FAB + popover panel with list view and thread view |
| `src/components/layout/MainLayout.tsx` | Add `<FloatingMessageBubble />` just before closing `</div>` — renders for all authenticated users |

No DB changes needed — all data already exists in `owner_messages` and `team_members`.

---

### Component Structure

```
FloatingMessageBubble
├── FAB button (fixed bottom-right, shows unread badge)
└── Panel (popover expanding upward from button, w-80, h-96)
    ├── Header: "Team Messages" + close button
    ├── [Owner view - list]
    │   ├── PM row: avatar initial, name, last message preview, time, unread dot
    │   └── ... (one row per team member)
    └── [Owner/PM view - thread]
        └── MessageThreadPanel (reused, with back button)
```

The panel uses `position: fixed` with `bottom-20` and `right-4` (above the FAB), with a smooth scale + opacity transition on open/close. On mobile, it expands to fill more of the screen width.

---

### Positioning

- FAB: `fixed bottom-6 right-6 z-50` — above all content, below modals/sheets
- Panel: `fixed bottom-20 right-6 z-50 w-80` — grows upward from FAB position
- On mobile (`< lg`): `right-4` and `w-[calc(100vw-2rem)]` for full-width feel

The FAB button is a circle with the chat bubble icon + a red unread badge in the top-right corner (similar to a typical messaging app). It uses `bg-primary` with a pulse animation when there are new unread messages.


## PM Message Threads — Full Conversation Feature

### What's Being Built

Right now, the notification panel shows a one-liner preview of a PM's message. Clicking it does nothing (`direct_message` returns `null` for route). The owner has no way to reply.

The goal: clicking a `direct_message` notification (or a dedicated "Messages" section) opens a full **chat thread panel** — a slide-in view showing the full conversation history between the owner and each PM, with a reply input at the bottom.

---

### Current Data Model Gap

The `owner_messages` table only has:
- `id`, `team_id`, `sender_id`, `message`, `created_at`

It's one-directional — only PMs can send, owners can only read. To support replies, we need to add a `recipient_id` column (nullable — NULL means "to owner", a UUID means "owner replying to that PM"). This lets us store both directions in the same table and group messages by PM (thread).

We also need the owner's RLS policies to allow them to **INSERT** reply messages.

---

### Database Changes

**Migration: Add `recipient_id` to `owner_messages` + owner INSERT policy**

```sql
-- 1. Add recipient_id column (NULL = message to owner, UUID = owner reply to that PM)
ALTER TABLE owner_messages ADD COLUMN IF NOT EXISTS recipient_id uuid;

-- 2. Allow owners to insert reply messages (sender = owner, recipient = PM's user_id)
CREATE POLICY "Owner can reply to messages"
ON owner_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = owner_messages.team_id
      AND teams.owner_id = auth.uid()
  )
);

-- 3. Allow PMs to see the owner's replies sent to them
CREATE POLICY "PMs can view owner replies to them"
ON owner_messages
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());
```

---

### New File: `src/components/layout/MessageThreadPanel.tsx`

A full chat-style sheet that slides in **on top of** (or replacing) the NotificationsPanel when a PM message is clicked. Features:

- **Header**: Back arrow + PM name (from `payload.actorName` or team member profile) + "Close"
- **Message list** (`ScrollArea`): Bubbles on left (PM) and right (owner), with timestamp under each
- **Input bar**: `Textarea` (Cmd+Enter to send) + Send button
- **Auto-scroll** to bottom on new messages
- **Loading state** while fetching thread

Message bubble styling:
```
PM (left):     [Jose Martinez]
               ┌──────────────────────────────┐
               │ Hey Kohan, just wrapped up…  │
               └──────────────────────────────┘
               2 minutes ago

Owner (right):                     [You]
                      ┌────────────────────┐
                      │ Thanks Jose, loop  │
                      │ me in please.      │
                      └────────────────────┘
                                  just now
```

---

### New Hook: `src/hooks/useMessageThread.ts`

Fetches all messages for a given team + PM sender (`actor_id` from notification payload), ordered by `created_at` ascending. Also exposes a `sendReply(text)` mutation that inserts a row with `sender_id = owner.id`, `recipient_id = pm.user_id`.

```ts
// SELECT * FROM owner_messages
// WHERE team_id = ? AND (sender_id = pm_id OR recipient_id = pm_id)
// ORDER BY created_at ASC
```

---

### Changes to `NotificationsPanel.tsx`

1. Add state: `const [threadActorId, setThreadActorId] = useState<string | null>(null)` and `threadActorName`
2. When a `direct_message` notification is clicked → set `threadActorId` and `threadActorName` from the payload instead of navigating
3. Render `<MessageThreadPanel>` conditionally inside the Sheet (panel-within-panel slide animation — the thread view replaces the notification list with a back button)

The panel uses a simple view-stack: `view: 'notifications' | 'thread'`. When `view === 'thread'`, the notification list is hidden and the thread is shown with a ← back arrow to return.

---

### Changes to `MessageOwnerButton.tsx` (PM side)

Currently shows a one-shot Dialog. Upgrade to a proper **thread dialog** so PMs can see the owner's replies:
- Fetch all messages where `sender_id = user.id OR recipient_id = user.id` for their `team_id`
- Show them as a chat thread with the same bubble UI
- Reply input stays at the bottom

---

### Files to Create / Modify

| File | Change |
|------|--------|
| **DB migration** | Add `recipient_id` column to `owner_messages`, add owner INSERT + PM SELECT policies |
| `src/hooks/useMessageThread.ts` | New hook — fetch thread by PM actor_id, send reply mutation |
| `src/components/layout/MessageThreadPanel.tsx` | New component — full chat thread UI |
| `src/components/layout/NotificationsPanel.tsx` | Add view-stack state, wire `direct_message` click to open thread |
| `src/components/project/MessageOwnerButton.tsx` | Upgrade from one-shot Dialog to full thread Dialog (PM sees replies) |

---

### Visual Flow

```
[Bell Icon] clicked
     ↓
[Notifications Panel slides in from left]
     │
     ├── Order Request notification → navigates to /procurement
     ├── Expense notification → navigates to project
     └── 💬 "Jose sent you a message…" → [Thread view slides in]
              ↓
         [← Back]  Jose Martinez
         ──────────────────────────────
         José: Hey Kohan, just wrapped up...   [2min ago]

                       You: Thanks! Loop me in.  [just now]

         José: Will do, talk soon.              [1min ago]
         ──────────────────────────────
         [Type a reply…                ] [Send]
```

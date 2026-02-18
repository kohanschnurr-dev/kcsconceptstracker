
## Add "Team" and "Support" Tabs to the Messages Panel

### Overview

The user wants two distinct conversation sections inside the floating messages bubble:

- **Team** — existing PM ↔ Owner thread (contractors/team members)
- **Support** — a new separate channel for software update requests and direct support chat

This applies to **both** Owner and PM roles, each seeing appropriate content under each tab.

---

### Architecture

**New database table: `support_messages`**

A new table to power the Support tab conversations. Support messages are between the user and "KCS Support" (Lovable/app team), so they are simply stored per-user with no team_id needed. Each row has:

- `id` (uuid)
- `user_id` (uuid) — who sent it
- `sender_role` (text) — `'user'` or `'support'`
- `message` (text)
- `created_at` (timestamp)
- `message_type` (text) — `'chat'` or `'feature_request'`

RLS: users can only read/write their own rows.

**New "Feature Request" sub-type under Support**

Within the Support tab, there will be two sub-sections:
1. **Chat** — free-form message thread (user → support)
2. **Feature Request** — a simple form to submit a software update request (stored as a `support_messages` row with `message_type = 'feature_request'`)

---

### UI Structure

```
FloatingMessageBubble
├── [Header with tab switcher]
│   ├── Team  (existing PM thread / owner list)
│   └── Support (new)
│
├── [Team Tab Content]  ← existing behavior, unchanged
│   ├── Owner: PM list → thread
│   └── PM: direct thread with owner
│
└── [Support Tab Content]  ← new
    ├── Sub-tabs: Chat | Feature Request
    ├── Chat: message thread (stored in support_messages)
    └── Feature Request: simple form (title + description → stored as support_messages)
```

---

### Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `supabase/migrations/XXXXXX_support_messages.sql` | Create | New `support_messages` table with RLS |
| `src/hooks/useSupportMessages.ts` | Create | Hook to fetch/send support chat messages and feature requests |
| `src/components/layout/SupportChatPanel.tsx` | Create | Support tab UI — chat thread + feature request form with sub-tabs |
| `src/components/layout/FloatingMessageBubble.tsx` | Modify | Add Team/Support tab switcher to the panel header; conditionally render Team vs Support content |

---

### Detailed Changes

#### 1. Database Migration — `support_messages`

```sql
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user', -- 'user' | 'support'
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'chat', -- 'chat' | 'feature_request'
  subject text, -- optional subject for feature requests
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support messages"
  ON public.support_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own support messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### 2. `useSupportMessages` Hook

Fetches all `support_messages` for the current user. Exposes:
- `messages` — all chat messages
- `featureRequests` — rows where `message_type = 'feature_request'`
- `sendMessage(text)` — inserts a chat message
- `submitFeatureRequest(subject, description)` — inserts a feature request row
- Realtime subscription on `support_messages` filtered to `user_id`

#### 3. `SupportChatPanel` Component

Two sub-tabs rendered with small pill-style toggles at the top:

**Chat sub-tab:**
- ScrollArea showing chat messages (user bubbles on right, support on left)
- Textarea + Send button at bottom
- Empty state: "Our support team will reply shortly"

**Feature Request sub-tab:**
- Simple form: Subject input + Description textarea + Submit button
- After submit: shows a success toast and the submitted request in a list below
- List shows past feature requests with timestamps and a "Submitted" badge

#### 4. `FloatingMessageBubble.tsx` Changes

Add a `activeTab` state: `'team' | 'support'`.

Below the panel header (X button row), add a tab bar:
```tsx
<div className="flex border-b border-border flex-shrink-0">
  <button
    className={cn('flex-1 py-2 text-xs font-medium', activeTab === 'team' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}
    onClick={() => setActiveTab('team')}
  >
    Team
  </button>
  <button
    className={cn('flex-1 py-2 text-xs font-medium', activeTab === 'support' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}
    onClick={() => setActiveTab('support')}
  >
    Support
  </button>
</div>
```

The existing Team content renders when `activeTab === 'team'`, the new `SupportChatPanel` renders when `activeTab === 'support'`.

When switching tabs, the panel height stays at `480px` for both.

---

### Visual Result

```
┌────────────────────────────┐
│ 💬 Messages           [X]  │
│ ─────────────────────────  │
│  [  Team  ] [  Support  ]  │  ← tab bar
│ ─────────────────────────  │
│                            │
│  Support Tab:              │
│  [ Chat ] [ Feature Req ]  │  ← sub-tabs
│                            │
│  ┌ Chat messages ────────┐ │
│  │ You: "App crashes..." │ │
│  │ Support: "We'll look" │ │
│  └───────────────────────┘ │
│  [Type a message...]  [→]  │
└────────────────────────────┘
```

---

### Notes

- The `handleClose` and backdrop logic are untouched — close behavior remains the same
- Switching tabs resets the thread view back to list (for the Team tab)
- The panel auto-sizes to 480px height for both tabs so there's no layout jump
- Support messages from the "support" side (`sender_role = 'support'`) can be inserted manually from the backend for now (no admin UI needed in this pass)

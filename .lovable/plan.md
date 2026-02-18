
## Add "Message Owner" Button to Project Detail Header

### How the System Already Works

The backend is already fully wired:
- `owner_messages` table exists with `team_id`, `sender_id`, and `message` columns
- `fn_notify_direct_message` trigger fires automatically on every INSERT into `owner_messages`, creating a notification in the owner's feed with `event_type: 'direct_message'`
- `NotificationsPanel` already renders `direct_message` notifications with a message preview

The only missing piece is the **frontend UI**: a button and dialog for PMs to compose and send a message.

### Who Should See the Button

The "Message Owner" button should only appear for **Project Managers** (team members who are NOT the owner). Owners do not need to message themselves.

Detection logic:
- Use `useTeam()` — if the current user is in `team_members` but NOT the `team.owner_id`, they are a PM
- Since `useTeam()` returns the owner's team (it queries `teams` where `owner_id = user.id`), a PM's call to `useTeam()` returns no team owned by them but they have a `team_members` entry
- Instead, query `team_members` to find if the current user is a member and get the `team_id`, then use `team_id` for the message insert

### Implementation Plan

#### 1. Create `src/hooks/useIsPM.ts` (new hook)
A lightweight hook that determines:
- Whether the current user is a PM (has a `team_members` entry)
- The `team_id` they belong to (needed to insert into `owner_messages`)

```ts
// Query: SELECT team_id FROM team_members WHERE user_id = auth.uid() LIMIT 1
// Returns: { isPM: boolean, teamId: string | null }
```

#### 2. Create `src/components/project/MessageOwnerButton.tsx` (new component)
A self-contained button + dialog component placed in the project header:

- Renders only when `isPM === true`
- Shows a `MessageCircle` icon button labeled "Message Owner"
- Opens a `Dialog` with:
  - A `Textarea` for the message body (required, min 1 char)
  - "Send" and "Cancel" buttons
  - Loading state while sending
- On submit: INSERTs into `owner_messages` with `{ team_id, sender_id: user.id, message }` 
- The DB trigger `fn_notify_direct_message` fires automatically, creating the notification
- On success: shows a toast "Message sent to owner", closes the dialog

#### 3. Update `src/pages/ProjectDetail.tsx`
Import and place `<MessageOwnerButton />` in the project header area — specifically in the right side of the `sm:flex-row sm:items-start sm:justify-between` row (where the right side currently has empty space next to the status badge area).

Position: in the top-right header group, alongside the existing reorder/settings button area on line ~891.

### Visual Placement

```
[ ← Back to Projects ]

[ Project Name ✏ 🗑  Active ▾ ]          [ Message Owner ]  [ ⚙ Reorder Tabs ]
[ 📍 Address   📅 Started Jan 1 ]
```

The button appears in the right side of the `sm:justify-between` header row, only visible to PMs.

### Technical Notes

- No schema changes needed — `owner_messages` table and its trigger already exist and are correctly configured
- RLS on `owner_messages` allows `INSERT` where `sender_id = auth.uid()` — PMs can insert without issue
- The notification is created by the server-side trigger, not client code, so it's reliable
- The `fn_notify_direct_message` trigger skips inserting if `owner_id = sender_id`, so no issue if an owner somehow triggers it

### Files to Create/Modify

| File | Action | Change |
|------|--------|--------|
| `src/hooks/useIsPM.ts` | Create | Hook to detect if current user is a team PM and get their team_id |
| `src/components/project/MessageOwnerButton.tsx` | Create | Button + Dialog component for composing and sending a message |
| `src/pages/ProjectDetail.tsx` | Modify | Import and place `<MessageOwnerButton />` in header right side |

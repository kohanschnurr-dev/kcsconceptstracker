
## Seed Sample Notifications + PM Message for UI Development

### What Will Be Inserted

No code changes are needed — this is pure data seeding directly into the database. I'll use a fictional GC/PM named "Jose Martinez" (a fake actor UUID) as the sender, and reference real projects from Kohan's account.

### Data to Seed

**Owner ID:** `809eee19-ba1a-4c13-beb6-ac7f4391a4d1` (Kohan Schnurr)
**Team ID:** `793b1b1e-9971-4773-8a4c-f5bb09fcd49d`
**Fake PM Actor UUID:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890` (Jose Martinez — fictional, no auth account needed since actor_id is just stored as a UUID reference in the payload)

### Notifications to Insert (8 total — all event types covered)

| # | Event Type | Description |
|---|-----------|-------------|
| 1 | `order_request` | Jose submitted an order request (3 items) |
| 2 | `expense` | Jose logged a $4,200 expense on N Hall St |
| 3 | `daily_log` | Jose added a daily log for N Hall St |
| 4 | `task_completed` | Jose completed "Frame garage wall studs" |
| 5 | `project_note` | Jose left a note on 8936 Belvedere Dr |
| 6 | `project_created` | Jose created a new project |
| 7 | `project_status` | Jose changed N Hall St status to in_progress |
| 8 | `direct_message` | Jose sent a direct message ("Hey Kohan, just wrapped up the rough framing…") |

Plus **1 owner_message** row so the "Message Owner" bell in the notification panel shows the full message thread.

### SQL to Execute

```sql
-- 8 sample notifications (all unread so the bell badge shows a count)
INSERT INTO notifications (owner_id, actor_id, event_type, entity_id, payload, is_read, created_at)
VALUES
  -- 1. Order request
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'order_request', NULL,
   '{"actorName":"Jose Martinez","itemCount":3,"notes":"Need lumber and drywall ASAP"}',
   false, now() - interval '5 minutes'),

  -- 2. Expense logged
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'expense', NULL,
   '{"actorName":"Jose Martinez","amount":4200,"projectName":"N Hall St","projectId":"aed21093-ee6c-4f36-b628-798328ff0d96","description":"Framing lumber and hardware","vendorName":"Home Depot"}',
   false, now() - interval '22 minutes'),

  -- 3. Daily log
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'daily_log', NULL,
   '{"actorName":"Jose Martinez","projectName":"N Hall St","projectId":"aed21093-ee6c-4f36-b628-798328ff0d96","logDate":"2026-02-18"}',
   false, now() - interval '1 hour'),

  -- 4. Task completed
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'task_completed', NULL,
   '{"actorName":"Jose Martinez","taskTitle":"Frame garage wall studs","projectName":"N Hall St","projectId":"aed21093-ee6c-4f36-b628-798328ff0d96"}',
   false, now() - interval '3 hours'),

  -- 5. Project note
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'project_note', NULL,
   '{"actorName":"Jose Martinez","projectName":"8936 Belvedere Dr","projectId":"3a05429a-6d1f-4432-a492-726e2bca45b6","contentPreview":"The inspector flagged the electrical panel — may need a change order"}',
   false, now() - interval '5 hours'),

  -- 6. Project created
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'project_created', NULL,
   '{"actorName":"Jose Martinez","projectName":"Mockingbird Duplex","projectId":"aed21093-ee6c-4f36-b628-798328ff0d96"}',
   true, now() - interval '1 day'),

  -- 7. Status change
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'project_status', NULL,
   '{"actorName":"Jose Martinez","projectName":"N Hall St","projectId":"aed21093-ee6c-4f36-b628-798328ff0d96","newStatus":"active","oldStatus":"planning"}',
   true, now() - interval '2 days'),

  -- 8. Direct message
  ('809eee19-ba1a-4c13-beb6-ac7f4391a4d1',
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'direct_message', NULL,
   '{"actorName":"Jose Martinez","messagePreview":"Hey Kohan, just wrapped up the rough framing on N Hall St. Electrical sub is coming Thursday — should I coordinate directly or loop you in first?","teamId":"793b1b1e-9971-4773-8a4c-f5bb09fcd49d"}',
   false, now() - interval '10 minutes');

-- 1 owner_message (the PM message thread)
INSERT INTO owner_messages (team_id, sender_id, message, created_at)
VALUES (
  '793b1b1e-9971-4773-8a4c-f5bb09fcd49d',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Hey Kohan, just wrapped up the rough framing on N Hall St. Electrical sub is coming Thursday — should I coordinate directly or loop you in first?',
  now() - interval '10 minutes'
);
```

### Expected Result After Seeding

- **Bell badge** shows **6** (6 unread notifications)
- Notifications panel shows all 8 entries covering every event type
- 5 unread (highlighted with blue dot), 2 older ones already read
- Clicking "order request" → navigates to `/procurement`
- Clicking expense/log/task/note/status → navigates to the relevant project tab
- Direct message shows full preview text from Jose Martinez

### No Code Changes Needed

This is purely data insertion — the UI (`NotificationsPanel.tsx` and `useNotifications.ts`) is already built and will automatically display these once they're in the database.

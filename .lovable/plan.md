
## Procurement Order List Feature

### Overview

A project manager (team member with "manager" role) who does not have credit card access can select items from the Procurement table or a Bundle detail page and submit an "Order Request" for the owner to review. The owner sees pending orders in an inbox-style panel, can approve/reject individual line items, and marks them purchased when done.

---

### How Role Detection Works

The app already has a team system (`useTeam`) and role-based permissions (`useTeamRoles`). A user is the **owner** if `team.owner_id === user.id`. A user is a **project manager** if they appear in `team_members` with `role = 'manager'`. The current user's membership role is checked client-side via these hooks — no new auth tables needed.

---

### Database Changes (1 migration)

**New table: `procurement_order_requests`**

```sql
CREATE TABLE public.procurement_order_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL,
  submitted_by uuid NOT NULL,           -- user_id of the PM
  status      text NOT NULL DEFAULT 'pending',  -- 'pending' | 'partially_approved' | 'completed' | 'rejected'
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**New table: `procurement_order_request_items`**

```sql
CREATE TABLE public.procurement_order_request_items (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_request_id          uuid NOT NULL REFERENCES procurement_order_requests(id) ON DELETE CASCADE,
  procurement_item_id       uuid NOT NULL,
  quantity                  integer NOT NULL DEFAULT 1,
  unit_price                numeric NOT NULL DEFAULT 0,
  item_name                 text NOT NULL,       -- snapshot of name at time of request
  item_image_url            text,
  item_source_url           text,
  item_source_store         text,
  owner_decision            text,               -- NULL | 'approved' | 'rejected'
  owner_notes               text,
  created_at                timestamptz NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- `procurement_order_requests`: PM (submitted_by = auth.uid()) can INSERT and SELECT their own. Owner (verified via `get_team_owner_id(auth.uid()) = team_id owner`) can SELECT, UPDATE all in their team.
- `procurement_order_request_items`: Same inheritance — accessible to the submitter and the team owner.

---

### New Files to Create

1. **`src/components/procurement/SubmitOrderModal.tsx`**
   - Shows a dialog listing selected items (name, image, price, qty)
   - Optional notes textarea for the PM
   - "Submit Order Request" button → inserts into DB

2. **`src/components/procurement/OrderRequestsPanel.tsx`**
   - Shown only to owners
   - Lists all pending orders grouped by submitter / date
   - Each order expands to show line items with "Approve" / "Reject" toggle per item
   - Footer: "Mark All Purchased" button that sets all approved items' status to `ordered` in `procurement_items`
   - In-app badge count (unread pending orders)

3. **`src/hooks/useOrderRequests.ts`**
   - Fetches orders for the current user (as PM: their own submissions; as owner: all team orders)
   - Exposes `submitOrder`, `updateItemDecision`, `markOrderComplete` mutations

---

### Files to Modify

#### `src/pages/Procurement.tsx`
- Import and show `SubmitOrderModal` when PM clicks a new **"Request Order"** button in the bulk selection floating bar (appears alongside "Assign to Project" when items are selected)
- Import and show `OrderRequestsPanel` as a slide-in sheet (accessible via a bell/inbox icon in the page header — badge shows pending count, visible only to owners)
- Detect owner vs. manager using `useTeam` and `useAuth`

#### `src/pages/BundleDetail.tsx`
- Add checkboxes next to each item row (multi-select)
- Add a floating "Request Order" bar at the bottom (identical to Procurement page) when items are selected
- Same `SubmitOrderModal` is reused

---

### User Experience Flow

**Project Manager:**
1. Checks items in the Procurement table or Bundle detail
2. Clicks "Request Order" in the floating bar
3. Reviews selected items in a modal, optionally adds a note
4. Clicks "Submit" → order saved with status `pending`
5. Sees a confirmation toast "Order request submitted"

**Owner:**
1. Sees a badge/icon in the Procurement header showing "N pending order request(s)"
2. Clicks it to open the Order Requests panel (sheet)
3. Sees each request card with submitter name, date, notes, and list of items
4. Toggles each item: Approve ✓ / Reject ✗ (with optional per-item note)
5. Clicks "Mark Purchased" → updates the `procurement_items.status` to `'ordered'` for all approved items and marks the order `'completed'`

---

### Technical Notes

- **Owner detection**: `user.id === team?.owner_id` (using `useTeam` hook, already available)
- **PM detection**: user appears in `members` list with `role = 'manager'`
- **No email notifications** (user chose in-app only) — just a badge count derived from live DB query
- **Snapshot data**: item name, price, image, and source URL are captured at submission time so the order record is stable even if items are later edited
- **Line-item control**: per the user's answer, the owner approves/rejects individual items, not the whole order at once

---

### Files to Create/Modify Summary

| Action | File |
|--------|------|
| Create | `src/components/procurement/SubmitOrderModal.tsx` |
| Create | `src/components/procurement/OrderRequestsPanel.tsx` |
| Create | `src/hooks/useOrderRequests.ts` |
| Modify | `src/pages/Procurement.tsx` |
| Modify | `src/pages/BundleDetail.tsx` |
| DB Migration | `procurement_order_requests` + `procurement_order_request_items` tables + RLS |

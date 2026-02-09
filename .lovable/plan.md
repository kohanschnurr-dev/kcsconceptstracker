
## Add "Info" Tab to Project Detail Page

### Overview

Add a new "Info" tab after "Team" in the project detail page. This tab displays key property condition data as a simple editable form with the following fields:

- Foundation Status
- Gas/Electric
- Roof Year and Type
- HVAC Year -- Condenser/Furnace
- Drain Line Material
- Window Status
- Electrical Status
- Plumbing Status

### Database Change

Create a `project_info` table to store this data, one row per project:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | Default `gen_random_uuid()` |
| `project_id` | uuid (FK to projects, unique) | One info record per project |
| `user_id` | uuid | For RLS |
| `foundation_status` | text | e.g. "Pier & beam, leveled", "Slab, cracked" |
| `gas_electric` | text | e.g. "Gas", "Electric", "Both" |
| `roof_year` | text | e.g. "2018" |
| `roof_type` | text | e.g. "Composition shingle", "Metal" |
| `hvac_year` | text | e.g. "2020" |
| `hvac_condenser` | text | e.g. "Trane 3-ton" |
| `hvac_furnace` | text | e.g. "Lennox 80k BTU" |
| `drain_line_material` | text | e.g. "Cast iron", "PVC", "ABS" |
| `window_status` | text | e.g. "Original single-pane", "Replaced 2022" |
| `electrical_status` | text | e.g. "200 amp, updated panel" |
| `plumbing_status` | text | e.g. "Copper supply, PVC waste" |
| `created_at` / `updated_at` | timestamptz | Standard timestamps |

RLS: Users can only read/write their own rows (matching `user_id`).

### Frontend Changes

**1. New component: `src/components/project/ProjectInfo.tsx`**

- Accepts `projectId` prop
- Fetches from `project_info` where `project_id` matches
- Displays a clean card with labeled fields in a 2-column grid
- Each field is an editable text input
- Auto-saves on blur (upsert to database)
- Shows placeholder text when empty to guide the user

**2. Update `src/pages/ProjectDetail.tsx`**

- Add `<TabsTrigger value="info">Info</TabsTrigger>` after Team
- Add corresponding `<TabsContent>` rendering the new `ProjectInfo` component

### UI Layout

The Info tab will show a single card with fields grouped logically:

```
+--------------------------+--------------------------+
| Foundation Status        | Gas / Electric           |
| [text input]             | [text input]             |
+--------------------------+--------------------------+
| Roof Year                | Roof Type                |
| [text input]             | [text input]             |
+--------------------------+--------------------------+
| HVAC Year                | Condenser                |
| [text input]             | [text input]             |
+--------------------------+--------------------------+
| Furnace                  | Drain Line Material      |
| [text input]             | [text input]             |
+--------------------------+--------------------------+
| Window Status            | Electrical Status        |
| [text input]             | [text input]             |
+--------------------------+--------------------------+
| Plumbing Status          |                          |
| [text input]             |                          |
+--------------------------+--------------------------+
```

Fields save automatically when you click out of them -- no save button needed.

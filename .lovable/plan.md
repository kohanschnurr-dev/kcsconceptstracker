

## Create CRM Database Tables

The error "Could not find the table 'public.crm_contacts' in the schema cache" means the four CRM tables referenced by the code don't exist yet. They need to be created with proper RLS policies.

### Database Migration

Create four tables matching the types defined in `src/types/crm.ts`:

1. **`crm_contacts`** — all contact/lead fields (name, phone, email, property details, status, motivation, etc.) with `user_id` referencing `auth.users(id)`
2. **`crm_activities`** — activity log per contact (type, description, outcome, duration, notes) with FK to `crm_contacts`
3. **`crm_calendar_events`** — CRM-specific calendar events (follow-ups, appointments) with FK to `crm_contacts`
4. **`crm_offers`** — offer tracking per contact (amount, method, response) with FK to `crm_contacts`

### RLS Policies

Each table gets standard user-scoped RLS:
- SELECT/INSERT/UPDATE/DELETE where `auth.uid() = user_id`
- For child tables (`crm_activities`, `crm_calendar_events`, `crm_offers`), policies check `user_id` directly (each row stores `user_id`)

### No Code Changes Needed

The hooks in `useCRM.ts` and types in `crm.ts` already match the schema — only the database tables are missing.


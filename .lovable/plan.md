

## Fix "No Team Found" and Use Business Name as Team Name

### Problem
The teams table is currently empty. When the `useTeam` hook tries to auto-create a team, it appears to fail silently. Additionally, the team should be named after the user's business (e.g., "KCS Concepts") rather than being unnamed.

### Solution

**1. Fix team auto-creation in `useTeam.ts`**
- When auto-creating a team, first fetch the user's `company_settings` to get their `company_name`
- Use that name as the team name (fallback to null if no company name is set)
- Add better error handling so failures are visible

**2. Keep team name in sync with business name**
- When the user updates their company name in settings, also update the team name
- This can be done in `useCompanySettings.ts` by updating the `teams` table when `company_name` changes

### Files to Modify

**`src/hooks/useTeam.ts`**
- In the auto-create logic, query `company_settings` for the user's `company_name`
- Insert the team with `name` set to the company name
- Add error logging for debugging

**`src/hooks/useCompanySettings.ts`**
- In the `updateSettings` mutation, after updating `company_settings`, also update the `teams.name` column if the user owns a team

### Technical Details

In `useTeam.ts`, the auto-create block will change from:
```typescript
const { data: newTeam, error: insertError } = await supabase
  .from('teams')
  .insert({ owner_id: user.id })
  .select()
  .single();
```
To:
```typescript
// Fetch company name for team name
const { data: companyData } = await supabase
  .from('company_settings')
  .select('company_name')
  .eq('user_id', user.id)
  .maybeSingle();

const { data: newTeam, error: insertError } = await supabase
  .from('teams')
  .insert({ 
    owner_id: user.id, 
    name: companyData?.company_name || null 
  })
  .select()
  .single();
```

In `useCompanySettings.ts`, after updating the company name, sync it to the team:
```typescript
if (companyName !== undefined) {
  await supabase
    .from('teams')
    .update({ name: companyName || null })
    .eq('owner_id', user.id);
}
```

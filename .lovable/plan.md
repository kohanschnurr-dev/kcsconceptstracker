

## Fix Security Issues

### Overview
Address all 5 detected security issues: 2 errors and 3 warnings. After analysis, here's what needs to happen:

### Issue 1: "RLS Policy Always True" + "OAuth State Validation Could Be Bypassed" (Warning)
**Problem:** The `quickbooks_oauth_states` table has a policy called "Service role has full access" that grants unrestricted read/write to ALL users (including anonymous), not just the service role. This means any user could manipulate OAuth state records.

**Fix:** Drop this overly permissive policy. The edge function already uses the service role key (which bypasses RLS entirely), so this policy is unnecessary and dangerous.

```sql
DROP POLICY "Service role has full access" ON quickbooks_oauth_states;
```

### Issue 2: "Leaked Password Protection Disabled" (Warning)
**Problem:** Users can sign up with passwords that have appeared in known data breaches.

**Fix:** Enable leaked password protection via the auth configuration.

### Issue 3: "Receipt Data Could Be Accessed" (Error - False Positive)
**Analysis:** The `pending_receipts` table already has correct RLS policies -- all operations require `auth.uid() = user_id`. Data is properly protected. Will mark this finding as resolved in the security scanner.

### Issue 4: "User Personal Information Could Be Exposed" (Error - False Positive)  
**Analysis:** The `profiles` table already has correct RLS policies -- SELECT, INSERT, and UPDATE all require `auth.uid() = user_id`. Users can only see their own profile. Will mark this finding as resolved in the security scanner.

### Technical Details

**Database migration:**
- Drop the "Service role has full access" policy from `quickbooks_oauth_states`

**Auth configuration:**
- Enable HaveIBeenPwned leaked password protection

**Security findings:**
- Mark `pending_receipts_financial_exposure` as ignored (already properly secured)
- Mark `profiles_personal_data_exposure` as ignored (already properly secured)

### Files Modified
- Database migration (drop overly permissive RLS policy)
- Auth config update (enable leaked password protection)
- Security findings updates (dismiss false positives with justification)


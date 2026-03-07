

## Plan: Remove the "What best describes you?" role selection step

**File:** `src/pages/GetStarted.tsx`

The role selection step (step 2) will be removed entirely, reducing the flow from 7 steps to 6. The new flow becomes: Welcome → Projects per year → Pain points → Current tools → Team size → Create account.

### Changes:

1. **Remove `ROLES` array** (lines 16-23) and `userRole` state
2. **Update `TOTAL_STEPS`** from 7 to 6
3. **Remove step 2 case** from `renderStep()` and renumber all subsequent steps down by 1
4. **Update `canContinue()`** to remove the role check and renumber cases
5. **Remove `userRole` from onboarding insert** and localStorage flag
6. **Update bottom nav conditions** — adjust step boundary checks (steps 2-5 show back+continue, step 6 shows back only)

Single file edit. The auto-advance behavior on single-select steps is preserved for the remaining steps.


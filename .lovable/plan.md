

## Plan: Add a Personalized Value Summary Step to the Onboarding Flow

Insert a new step between "Team size" (current step 5) and "Create account" (current step 6) that calculates and displays personalized metrics based on the user's earlier answers -- turning the questionnaire into a sales tool.

### How It Works

Using the answers from steps 2-5, we compute estimated value metrics:

- **Hours saved per month** — derived from project volume and team size (more projects + bigger team = more admin overhead saved)
- **Annual time cost recovered** — hours saved x an estimated hourly rate ($45 default, similar to CostCalculator)
- **Pain points addressed** — map the user's selected pain points to specific GroundWorks features, shown as a checklist ("You said X -- we solve that with Y")
- **Tool consolidation** — based on their current tools answer, show how many tools they can replace

### New Step Layout (Step 6, account becomes Step 7)

A "Your GroundWorks Impact" summary card with:
1. **Headline**: "Here's what GroundWorks can do for you"
2. **Three animated stat cards** (count-up animation):
   - "~X hrs/month saved" 
   - "$X,XXX/year in time recovered"
   - "Replace X scattered tools with 1 platform"
3. **Pain point → feature mapping** (2-3 items based on their selections):
   - e.g., "Tracking budgets & expenses" → "Real-time budget tracking with alerts"
   - e.g., "Scattered docs and photos" → "Project-linked document & photo gallery"
4. **CTA**: "Start My Free Trial" button that advances to the account creation step
5. **Subtext**: "No credit card required -- 7-day free trial"

### Calculation Logic

```text
Volume multiplier:  1-2 → 1.0,  3-5 → 2.0,  6-10 → 3.5,  10+ → 5.0
Team multiplier:    Just me → 1.0,  2-5 → 1.5,  6-15 → 2.5,  15+ → 4.0
Base hours saved:   8 hrs/month
Estimated hours:    base × volume_mult × team_mult (capped reasonably)
Dollar value:       hours × $45/hr
Tools replaced:     based on currentTools answer (1-4 range)
```

### File Changes

**`src/pages/GetStarted.tsx`**:
- Change `TOTAL_STEPS` from 6 to 7
- Add calculation helper functions for the value metrics
- Add a pain-point-to-feature mapping object
- Insert new step 6 (value summary) with animated stat cards
- Move account creation to step 7
- Update `canContinue()` and navigation logic accordingly

### What We Do NOT Touch
- No other files need changes
- No database changes
- No new dependencies (count-up can be done with a simple `useEffect` + `requestAnimationFrame`)


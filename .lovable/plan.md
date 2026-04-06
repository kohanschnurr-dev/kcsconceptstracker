

## Plan: Add Accruing Interest Tracking to Phases & Draws

**What changes**: Each funded draw will calculate accruing interest from its funded date to today. There will be a global default interest rate at the top, with the ability to override the rate on individual phases.

### Data Model Changes

Add to the `DrawPhase` interface:
- `interestRateOverride?: number` — optional per-phase rate; when empty, uses the global rate

Add top-level state:
- `globalInterestRate: number` — default annual interest rate (persisted in localStorage alongside phases)

### Interest Calculation Logic

For each funded phase with a `dateFunded`:
- Days elapsed = difference between today and `dateFunded`
- Monthly interest = `budgetedAmount × (rate / 100 / 12)`
- Accrued interest = `monthlyInterest × (daysElapsed / 30.44)`
- Effective rate = phase's `interestRateOverride` if set, otherwise `globalInterestRate`

### UI Changes

**1. Summary Card** — Add a new "Accrued Interest" stat (5th column) showing the total accrued interest across all funded phases in red/warning text.

**2. Global Rate Input** — In the summary card header area, add an editable interest rate field (e.g., `10%`) labeled "Annual Rate" that applies to all phases by default.

**3. Per-Phase Row** — For funded phases, add:
- A small rate input (e.g., `w-20`) next to the status selector, pre-filled with the global rate but editable per-phase. Shown with a `%` suffix.
- A read-only "Accrued" dollar amount displayed inline, showing interest accrued since the funded date.

**4. Interest Summary Card** — New card below the phases list showing a breakdown table: phase name, principal, rate, days outstanding, accrued interest — with a total row at the bottom.

### Files to Change

- `src/components/project/PhasesDrawsTab.tsx` — All changes in this single file

### Persistence

The global rate and per-phase overrides are stored in the same localStorage key (`phases-draws-{projectId}`) as a wrapper object: `{ globalRate: number, phases: DrawPhase[] }`.




## Redesign Auth Page to Match "GroundWorks" Layout

Replace the current centered card layout with a split-panel design matching the reference screenshot (image-886.png).

### Layout

**Left half** — branding/marketing panel:
- KCS logo + "GroundWorks" name at top-left
- Large headline: "Built for **every build.**" (bold orange on "every build")
- Subtitle: "Track budgets, expenses, daily logs, and team activity across every fix & flip project."
- Bullet list with orange dot indicators:
  - Real-time budget tracking per project
  - Team messaging & daily site logs
  - Vendor & procurement management
  - AI-powered expense receipt parsing
- Bottom footer: green dot + "Secured by Supabase · All data encrypted at rest"

**Right half** — auth form panel:
- Remove the Tabs component (no more Sign In / Sign Up toggle tabs)
- Default view: "Welcome back" heading with "Don't have an account? Sign up" link
- Google button, OR divider, Email + Password fields, "Forgot password?" link, Sign In button
- Clicking "Sign up" swaps to sign-up form (same panel, state-driven, no tabs)
- Footer: "© 2026 GroundWorks · All rights reserved"

### Responsive
- On mobile (`< lg`), stack vertically: branding panel on top (condensed), form below

### Files Modified
- `src/pages/Auth.tsx` — full rewrite of the JSX layout; keep all existing form logic, validation, handlers intact


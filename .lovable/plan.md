

## Plan: Add hidden admin link on landing page

**File**: `src/components/landing/LandingFooter.tsx`

Add a subtle, inconspicuous link to `/admin` in the landing page footer — something like making the copyright year or a period clickable, so only you would know it's there. No visible "Admin" text.

Alternatively, if you prefer it more findable during development: add a small muted "Admin" text link in the footer's bottom row that blends in.

**Approach**: Add a `<Link to="/admin">` in the footer, styled as `text-muted-foreground/30 text-[10px] hover:text-primary` so it's nearly invisible but clickable. The `/admin` route already has its own email-based guard so no one else can use it.


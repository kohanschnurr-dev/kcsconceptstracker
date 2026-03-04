

## Sleek Split-Screen Auth Page

Redesign `src/pages/Auth.tsx` into a two-panel layout matching the KCS aesthetic.

### Layout

```text
┌─────────────────────────┬──────────────────────┐
│                         │                      │
│   LEFT PANEL (lg+)      │   RIGHT PANEL        │
│   Dark bg + grid        │   Centered form      │
│   Orange radial glow    │   max-w-[340px]      │
│   Logo + headline       │                      │
│   4 feature bullets     │   Sign In / Sign Up  │
│   Encryption badge      │   toggle + forms     │
│                         │                      │
└─────────────────────────┴──────────────────────┘
```

On mobile: left panel hidden, right panel fills screen.

### Left Panel Content
- KCS logo (`kcs-logo.png`) + "GroundWorks" text
- Headline: "Construction Budget Tracking Built for Flippers"
- 4 feature bullets with icons:
  1. `Calculator` -- Real-time budget tracking
  2. `Users` -- Team messaging & collaboration
  3. `Receipt` -- AI-powered receipt parsing
  4. `ShieldCheck` -- Bank-grade data encryption
- Bottom badge: lock icon + "256-bit encrypted | Secured by Lovable Cloud"

### Left Panel Styling
- `bg-black` with a CSS grid pattern overlay (thin #333 lines)
- Orange radial gradient glow behind the logo area (`bg-[radial-gradient(circle_at_center,rgba(255,140,0,0.15),transparent_70%)]`)
- All text white/gray

### Right Panel
- Same form logic (Google OAuth, email sign-in/sign-up) but stripped of the Card wrapper
- Form container: `max-w-[340px] w-full mx-auto`
- Replace Tabs with two text buttons ("Sign In" / "Sign Up") toggling `activeTab` state (already exists)
- Clean, minimal -- no card border, just the form fields on the background

### Technical
- Single file edit: `src/pages/Auth.tsx`
- Add lucide imports: `Calculator, Users, Receipt, ShieldCheck, Lock`
- Remove Card/CardHeader/CardContent/Tabs/TabsList/TabsTrigger imports (use simple state toggle instead)
- Keep all form validation, handlers, Google OAuth logic unchanged


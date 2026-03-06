

## Replace FeatureShowcase with Click-to-Expand Dialogs on PlatformOverview Cards

**Goal**: Remove the massive FeatureShowcase section and instead open a dialog when a user clicks a module card in PlatformOverview. The dialog shows detailed bullet points + a placeholder for a demo video.

### Changes

**1. `src/components/landing/PlatformOverview.tsx`**
- Add detailed data (headline, bullets) to each module that has showcase content (Budget, Team, Procurement, Financial, Reporting). The other modules get their `desc` promoted to a simple bullet list.
- Make each card clickable -- on click, open a Dialog showing:
  - Icon + title + headline
  - Bullet list with checkmark icons (same style as current FeatureShowcase)
  - A 16:9 video placeholder area with a "Demo coming soon" message (or an actual `<video>` / `<iframe>` embed spot you can fill in later)
- Use the existing `Dialog` component from `src/components/ui/dialog.tsx`.
- Add `cursor-pointer` to each card.

**2. `src/pages/Landing.tsx`**
- Remove the `<FeatureShowcase />` import and usage from the page to eliminate the space-heavy section.

**3. `src/components/landing/FeatureShowcase.tsx`**
- Keep the file (no deletion needed) but it will no longer be rendered. Can be cleaned up later.

### Dialog Layout

```text
┌─────────────────────────────────────────┐
│  [Icon]  Feature Title                  │
│  Headline text                          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │     Demo Video Placeholder      │    │
│  │        (16:9 aspect ratio)      │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ✓ Bullet point one                     │
│  ✓ Bullet point two                     │
│  ✓ Bullet point three                   │
│  ✓ Bullet point four                    │
│  ✓ Bullet point five                    │
└─────────────────────────────────────────┘
```


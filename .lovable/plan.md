

## Add New GroundWorks Logo to Auth Page

The user wants to replace/use the uploaded hard hat + gear logo on the auth page's left panel.

### Changes

1. **Copy the uploaded logo** (`GroundWorks_5-2.png`) to `src/assets/groundworks-app-logo.png`
2. **Update `src/pages/Auth.tsx`** — Replace the current `groundworks-logo.png` import with the new logo in the left panel's logo section (the `h-14 w-14` image next to "GroundWorks" text)


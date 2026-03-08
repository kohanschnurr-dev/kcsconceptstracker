

## Plan: Replace GroundWorks logo with new icon-only version

Copy the uploaded logo (`Ground_Works_No_Word.png`) to replace `src/assets/groundworks-logo-new.png` and `public/favicon.png`. Since all brand logo references already point to `groundworks-logo-new.png`, no import changes are needed — just replacing the asset file.

### Steps

1. **Copy** `user-uploads://Ground_Works_No_Word.png` → `src/assets/groundworks-logo-new.png` (overwrites current)
2. **Copy** `user-uploads://Ground_Works_No_Word.png` → `public/favicon.png` (overwrites current)

No code changes required. All existing imports in LandingHeader, GetStarted, and Auth already reference `groundworks-logo-new.png`.




## Reorder Landing Page Sections

Move the **FeaturesGrid** above **BuiltFor** so visitors see the feature cards before the investor personas.

### File: `src/pages/Landing.tsx`

Change the section order from:
```
Hero → BuiltFor → FeaturesGrid → ...
```
To:
```
Hero → FeaturesGrid → BuiltFor → ...
```

Single line swap — no other changes needed.


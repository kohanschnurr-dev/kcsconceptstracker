

Update the third stat in `src/components/landing/StatsRow.tsx`:
- Change label from `"To Start Tracking Today!"` to `"To Start Tracking Today!"`  (keep same)
- Add `"Under "` as prefix, remove the `" min"` suffix, keep value as `5`, and set suffix to `" min"`

Actually, looking at current code: `{ value: 5, prefix: "", suffix: " min", label: "To Start Tracking Today!" }`

The user wants it to read "Under 5 min" instead of "5 min". Change prefix to `"Under "`.

**File:** `src/components/landing/StatsRow.tsx`  
- Update third stat entry: change `prefix` from `""` to `"Under "`.


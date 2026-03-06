

## Plan: Auto-advance on selection

### Change in `src/pages/GetStarted.tsx`

For single-select steps (2, 3, 5, 6), auto-advance to the next step when the user clicks an option. Step 4 (pain points, multi-select up to 3) keeps the Continue button since users need to pick multiple items.

- In step 2: `onClick={() => { setUserRole(role.label); setStep(3); }}`
- In step 3: `onClick={() => { setAnnualVolume(v); setStep(4); }}`
- In step 5: `onClick={() => { setCurrentTools(tool); setStep(6); }}`
- In step 6: `onClick={() => { setTeamSize(size); setStep(7); }}`

Add a small delay (~300ms) before advancing so the user sees their selection highlight briefly.

The bottom nav Continue button still shows for step 4 (multi-select). For steps 2/3/5/6, the Continue button can remain as a fallback but the auto-advance handles the primary flow.


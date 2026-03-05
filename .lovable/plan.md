

## Remove Location/Key Quantities and Move Job Title into Scope of Work Section

### Changes in `src/components/vendors/ScopeOfWorkSheet.tsx`
1. **Remove state** for `location` and `keyQuantities` (lines 58-59)
2. **Remove resets** in `handleOpenChange`: `setLocation('')` and `setKeyQuantities('')` (lines 79-80)
3. **Remove from `buildContent()`**: the location and keyQuantities blocks (lines 106-114)
4. **Remove from `getPdfOptions()`**: `location` and `keyQuantities` properties (lines 160-161)
5. **Remove entire "Job Details" section** (lines 238-257) — the section label, job title input, location input, and key quantities input
6. **Add Job Title input** inside the "Scope of Work" section, before the WorkItemLines components (around line 261)

### Changes in `src/lib/pdfExport.ts`
1. **Remove** `location` and `keyQuantities` from `ScopeOfWorkData` interface (lines 47-48)
2. **Remove** the `detail-band` rendering block for location/keyQuantities (lines 972-976)

Two files, straightforward removals plus moving one input field.


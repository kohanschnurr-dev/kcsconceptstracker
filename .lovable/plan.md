

## Update Phase Filter to Full Set

The main Procurement page (`src/pages/Procurement.tsx`) currently only has 4 phases (Rough-In, Trim Out, Finish, Punch List), while the project-level procurement tab has the full 7. This update adds Demo, Drywall, and Final to match.

### Technical Details

**File: `src/pages/Procurement.tsx`**

1. Update the `Phase` type (line 35) to include `demo`, `drywall`, and `final`:
   ```
   type Phase = 'demo' | 'rough_in' | 'drywall' | 'trim_out' | 'finish' | 'punch' | 'final';
   ```

2. Update the `PHASES` array (lines 81-86) to the full set:
   ```
   { value: 'demo', label: 'Demo' },
   { value: 'rough_in', label: 'Rough-In' },
   { value: 'drywall', label: 'Drywall' },
   { value: 'trim_out', label: 'Trim Out' },
   { value: 'finish', label: 'Finish' },
   { value: 'punch', label: 'Punch List' },
   { value: 'final', label: 'Final' },
   ```

Single file, two small edits. The filter dropdown will now show all 7 phases matching the project-level view.


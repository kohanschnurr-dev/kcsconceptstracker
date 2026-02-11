

## Fix: Items with "Finish" phase showing under "Rough-in" in Project Procurement Tab

### Problem
The Procurement Item Modal saves phase as `finish` or `punch`, but the Project's Procurement Tab (`src/components/project/ProcurementTab.tsx`) uses a **different, outdated set of phases**: `demo`, `rough_in`, `drywall`, `trim_out`, `final`.

Since `finish` isn't in that list, the grouping logic falls through to the default bucket -- `rough_in`. That's why your "Finish" stage item shows under "Rough-in".

### Fix
Update `src/components/project/ProcurementTab.tsx` to use the same phase values as everywhere else:

**1. Update the Phase type** (line 43):
- From: `'demo' | 'rough_in' | 'drywall' | 'trim_out' | 'final'`
- To: `'demo' | 'rough_in' | 'drywall' | 'trim_out' | 'finish' | 'punch' | 'final'`

**2. Update the PHASES array** (lines 93-99) to include all phases:
- Demo (order 1)
- Rough-in (order 2)
- Drywall (order 3)
- Trim Out (order 4)
- Finish (order 5)
- Punch List (order 6)
- Final (order 7)

**3. Update the Status type** (line 44) to match the rest of the app:
- From: `'researching' | 'in_cart' | 'ordered' | 'shipped' | 'on_site' | 'installed'`
- To: `'researching' | 'in_cart' | 'ordered' | 'delivered' | 'shipped' | 'on_site' | 'installed'`

This ensures the project procurement tab recognizes all the same phases that the modal can set, so items group correctly.

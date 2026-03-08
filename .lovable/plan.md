

## Plan: Update Pain Points to Be More Construction/Fix-and-Flip Focused

Replace three pain points with more relevant construction-based options and update the corresponding feature mappings.

### Changes in `src/pages/GetStarted.tsx`

**PAIN_POINTS array (lines 18-27)** — swap out three items:
- ~~"Keeping draw requests organized"~~ → **"Tracking change orders & scope creep"**
- ~~"Communicating with my team on site"~~ → **"Coordinating multiple rehabs at once"**
- ~~"Invoicing and getting paid"~~ → **"Estimating rehab costs accurately"**

**PAIN_FEATURE_MAP (lines 51-60)** — update the three corresponding entries:
- `"Tracking change orders & scope creep"`: `"Change order logging with budget-impact tracking"`
- `"Coordinating multiple rehabs at once"`: `"Multi-project dashboard with at-a-glance status"`
- `"Estimating rehab costs accurately"`: `"Category-level budget templates from past projects"`

No other files affected.


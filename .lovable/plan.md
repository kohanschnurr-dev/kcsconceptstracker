

## Change All Project Search Placeholders to "Search"

Every project search input currently shows "Search projects..." or similar. All instances will be updated to just say "Search".

### Files to Change

| File | Current Text | Line(s) |
|---|---|---|
| `src/components/ProjectAutocomplete.tsx` | Default prop `'Search projects...'` | 41 |
| `src/components/ProjectAutocomplete.tsx` | CommandInput `"Search projects..."` | 128 |
| `src/components/QuickExpenseModal.tsx` | `"Search projects..."` | 262 |
| `src/components/SmartSplitReceiptUpload.tsx` | `"Search projects..."` | 1403 |
| `src/components/calendar/NewEventModal.tsx` | `"Search projects..."` | 245 |
| `src/components/NewDailyLogModal.tsx` | `"Search projects..."` | 125 |
| `src/components/CreateBudgetModal.tsx` | `"Search projects..."` (and loading variant) | 509 |
| `src/pages/BusinessExpenses.tsx` | `"Search projects..."` | 884 |
| `src/pages/Projects.tsx` | `"Search projects..."` | 334 |

All 9 occurrences across 8 files will be changed to `"Search"`.

For CreateBudgetModal, the loading state placeholder `"Loading projects..."` will remain unchanged since that serves a different purpose.

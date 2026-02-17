

## Add Quick Log Entry on the Logs Tab

### What's Changing
A quick-add form will be added at the top of the Logs tab on the Project Detail page. Since the user is already viewing a specific project, the project will be pre-selected automatically -- they just type what work was done and hit save.

### Design
The quick-add will appear as a compact inline form above the existing log list, similar in spirit to the Quick Task Input on the dashboard. It will include:
- A text input for "Work Performed" (required)
- An optional expandable area for "Issues Encountered"
- Today's date pre-filled (editable)
- A "Save" button

No project selector needed since the project is already known from the page context.

### Technical Details

**File: `src/pages/ProjectDetail.tsx`**

Inside the `<TabsContent value="logs">` section, add a quick-add form above the "Daily Logs" card:

- Add local state: `quickLogWork`, `quickLogIssues`, `quickLogDate`, `quickLogSubmitting`
- On submit, insert into `daily_logs` table with the current project's `id` pre-set
- On success, call `fetchProjectData(false)` to refresh the logs list and clear the form
- The form will be a compact card with:
  - A single-line `Input` or small `Textarea` for work performed
  - A collapsible/optional issues field (small text button "Add issues?" toggles it)
  - Date defaults to today, shown as a small date input
  - "Add Log" button

```text
Logs Tab Layout:
+------------------------------------------------+
| [+] Quick Add Log                              |
| +--------------------------------------------+ |
| | Work performed today...          [date] [+] | |
| +--------------------------------------------+ |
|                                                |
| Daily Logs                        [View All]   |
| +--------------------------------------------+ |
| | Jan 31, 2026 ...                           | |
| | Jan 30, 2026 ...                           | |
| +--------------------------------------------+ |
+------------------------------------------------+
```

### Files
- **Edit**: `src/pages/ProjectDetail.tsx` -- Add quick-add form in the logs TabsContent, with inline state and submit handler

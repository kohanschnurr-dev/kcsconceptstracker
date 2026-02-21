

## Make the "Add Task" Button Larger and More Prominent

### Change

Update the "+ Add Task" button in the Daily Logs header to be bigger and more visually prominent as the focal point of the area.

### Technical Details

**`src/pages/DailyLogs.tsx` (line 520)**

Change the button from:
```tsx
<Button className="gap-2 w-full sm:w-auto h-11 sm:h-10" onClick={() => setAddTaskOpen(true)}>
  <Plus className="h-4 w-4" />
  Add Task
</Button>
```

To:
```tsx
<Button size="lg" className="gap-2 w-full sm:w-auto h-12 px-6 text-base font-semibold" onClick={() => setAddTaskOpen(true)}>
  <Plus className="h-5 w-5" />
  Add Task
</Button>
```

- Larger height (`h-12`) and more horizontal padding (`px-6`)
- Bigger text (`text-base`, `font-semibold`)
- Larger icon (`h-5 w-5`)
- Uses the `lg` size variant for consistent sizing

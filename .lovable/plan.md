## Goal

Simplify the New Project Event modal to be shorter and tidier:
1. Remove the Owner field entirely.
2. Combine Date, Recurring event, and Critical Path into a single compact 3-column row of equal-sized "pill" buttons that pop open detail panels when clicked, instead of three large stacked sections.

## UI Concept

A single row with three matching toggle-buttons:

```
┌───────────────┬───────────────┬───────────────┐
│ 📅 Apr 29     │ 🔁 Recurring  │ ⚠ Critical    │
│ Single day    │ Off           │ Off           │
└───────────────┴───────────────┴───────────────┘
```

- Each button is the same size, sharp-cornered, 1px border (theme-consistent).
- Click the **Date** button → opens a popover with the date picker + multi-day toggle inside.
- Click the **Recurring** button → opens a popover containing the frequency selector and "until" controls. The button's bottom label shows "Off" / "Monthly" / "Weekly until …".
- Click the **Critical Path** button → toggles on/off in place (no popover needed). When on: amber border + amber icon, label flips to "On".
- Active state = primary border + subtle primary tint, matching existing button styling.

This replaces ~140 lines of vertical UI with one tight row, while keeping every existing capability accessible.

## Technical Changes

**File: `src/components/calendar/NewEventModal.tsx`**

1. **Remove Owner**:
   - Delete `owner` state, `setOwner`, the `owner.trim()` validation in `handleSubmit`, the `owner` field on `baseEvent`, and the entire Owner JSX block (lines 550–559).
   - Remove `setOwner('')` from `resetForm`.

2. **Replace lines ~436–548 (Date block) + ~629–711 (Recurring block) + ~714–734 (Critical Path block)** with a new compact row component:

   ```tsx
   <div className="grid grid-cols-3 gap-2">
     {/* Date pill — Popover */}
     <Popover>
       <PopoverTrigger asChild>
         <button type="button" className="border border-border bg-card hover:bg-secondary px-3 py-2.5 text-left">
           <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
             <CalendarIcon className="h-3.5 w-3.5" /> Date
           </div>
           <div className="text-sm text-foreground mt-0.5 truncate">
             {isMultiDay && endDate ? `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d')}` : format(startDate, 'MMM d, yyyy')}
           </div>
         </button>
       </PopoverTrigger>
       <PopoverContent className="w-auto p-3 space-y-3">
         {/* Multi-day checkbox + Calendar(s) */}
       </PopoverContent>
     </Popover>

     {/* Recurring pill — Popover */}
     <Popover>
       <PopoverTrigger asChild>
         <button type="button" className={cn(
           "border px-3 py-2.5 text-left",
           isRecurring ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary"
         )}>
           <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
             <Repeat className="h-3.5 w-3.5" /> Recurring
           </div>
           <div className="text-sm text-foreground mt-0.5 truncate">
             {isRecurring ? recurrenceFrequency : 'Off'}
           </div>
         </button>
       </PopoverTrigger>
       <PopoverContent className="w-72 p-3 space-y-3">
         {/* Switch + frequency select + until controls */}
       </PopoverContent>
     </Popover>

     {/* Critical Path pill — toggle in place */}
     <button type="button" onClick={() => setIsCriticalPath(v => !v)}
       className={cn(
         "border px-3 py-2.5 text-left transition-colors",
         isCriticalPath ? "border-amber-500 bg-amber-500/5" : "border-border bg-card hover:bg-secondary"
       )}>
       <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
         <AlertTriangle className={cn("h-3.5 w-3.5", isCriticalPath && "text-amber-500")} /> Critical
       </div>
       <div className={cn("text-sm mt-0.5", isCriticalPath ? "text-amber-500" : "text-foreground")}>
         {isCriticalPath ? 'On' : 'Off'}
       </div>
     </button>
   </div>
   ```

3. The **30-day span warning** stays directly below the row.

4. Inside the **Date popover**: render the existing multi-day Checkbox + label, then either a single Calendar or two stacked Calendars based on `isMultiDay`.

5. Inside the **Recurring popover**: render the existing Switch row (label + Switch), and when `isRecurring` is true, render the Frequency `<select>`, Until type buttons, optional date picker, and the helper text.

6. All existing state (`startDate`, `endDate`, `isMultiDay`, `isRecurring`, `recurrenceFrequency`, `recurrenceUntilType`, `recurrenceUntilDate`, `isCriticalPath`) and `handleSubmit` recurrence logic remain untouched.

7. Add `Calendar as CalendarIcon` to the lucide import (alias to avoid conflict with the `Calendar` UI component already imported).

## Out of Scope

- No backend/database changes. The `owner` column on `calendar_events` stays in the schema but is simply no longer written by this modal.
- No changes to other event modals (e.g., Edit panel) unless follow-up requested.

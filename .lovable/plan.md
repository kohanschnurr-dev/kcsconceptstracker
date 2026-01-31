

## Soften the Tasks Due Today Banner

### What This Does
Tones down the "Tasks Due Today" banner from an alarming urgent style to a calm, informative "today's agenda" style that feels like a helpful reminder rather than a warning.

---

### Current Look (Too Urgent)
- Warning amber/orange border and background
- AlertTriangle (⚠️) icon
- "Action Required" heading
- Bright warning-colored badge
- Warning-colored "View Tasks" button

### New Look (Calm & Informative)
- Subtle muted border
- ClipboardList or ListChecks icon (neutral, task-oriented)
- "Today's Agenda" or "Today" heading
- Neutral secondary badge
- Soft primary-colored button

---

### Design Changes

| Element | Current | New |
|---------|---------|-----|
| Border/Background | `border-warning/50 bg-warning/5` | `border-border bg-muted/30` |
| Icon | `AlertTriangle` (warning) | `ListChecks` (neutral) |
| Icon container | `bg-warning/20` | `bg-primary/10` |
| Heading | "Action Required" (text-warning) | "Today" (text-foreground) |
| Badge | Warning colors | Secondary/muted |
| Main button | `bg-warning` | `bg-primary` or outline variant |

---

### Visual Comparison

**Before:**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Action Required  [1 Item]         [Roofing] [Calendar]│
│    1 event today                                         │
└─────────────────────────────────────────────────────────┘
  ^ Orange/amber warning styling throughout
```

**After:**
```
┌─────────────────────────────────────────────────────────┐
│ ✓ Today  [1 Item]                    [Roofing] [Calendar]│
│   1 event today                                          │
└─────────────────────────────────────────────────────────┘
  ^ Neutral muted styling, calm reminder feel
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/TasksDueTodayBanner.tsx` | Update icon, colors, and copy to be less urgent |

---

### Technical Changes

1. **Import different icon**: Replace `AlertTriangle` with `ListChecks` or `ClipboardList`
2. **Update container styling**: 
   - From: `border-warning/50 bg-warning/5`
   - To: `border-border bg-muted/30`
3. **Update icon container**: 
   - From: `bg-warning/20` with warning icon color
   - To: `bg-primary/10` with primary icon color
4. **Update heading**: 
   - From: "Action Required" with `text-warning`
   - To: "Today" with `text-foreground`
5. **Update badge styling**: Use neutral secondary colors instead of warning
6. **Update View Tasks button**: 
   - From: `bg-warning hover:bg-warning/90`
   - To: Primary variant or outline style

---

### Summary

- Replace warning icon with neutral task icon
- Change "Action Required" to "Today" 
- Use muted/neutral colors instead of amber/orange warning tones
- Keep functionality the same, just softer visual presentation


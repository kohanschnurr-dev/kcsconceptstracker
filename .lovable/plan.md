
## Make the Message Panel Bigger + Add Example Conversations to Team Tab

### What Needs to Change

Two focused changes to `src/components/layout/FloatingMessageBubble.tsx`:

1. **Bigger panel** — width `w-80` → `w-96` (320px → 384px), and fixed height/max-height `480px` → `580px`
2. **Example conversations** — replace the plain empty state in the Team tab's owner list view with realistic, clearly-labeled mock conversations

---

### Change 1 — Panel Size (lines 231 & 238)

**Line 231** — width class:
```
'w-80 sm:w-80'  →  'w-96 sm:w-96'
```

**Line 238** — height style:
```
style={{ height: view === 'thread' ? '480px' : 'auto', maxHeight: '480px' }}
→
style={{ height: '580px', maxHeight: '580px' }}
```
Making the height always `580px` (not just in thread view) gives a consistent, spacious feel across both list and thread states.

---

### Change 2 — Example Conversations (lines 296–301)

Replace the current empty state block:
```tsx
<div className="flex flex-col items-center justify-center py-12 ...">
  <MessageCircle className="h-8 w-8 opacity-30" />
  <p>No messages yet.</p>
  <p className="text-xs">Team members can message you from their projects.</p>
</div>
```

With a styled example list showing 2 mock PM conversations + an explanatory banner:

```tsx
<div className="flex flex-col">
  {/* Banner */}
  <div className="px-4 py-2 bg-muted/30 border-b border-border/50">
    <span className="text-xs text-muted-foreground italic">
      Example — invite team members to start chatting
    </span>
  </div>

  {/* Mock PM 1 — Jose Rodriguez */}
  <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 opacity-55 cursor-default select-none">
    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">JR</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Jose Rodriguez</span>
        <span className="text-xs text-muted-foreground">2h ago</span>
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">Drywall delivery confirmed for Thursday 👍</p>
    </div>
  </div>

  {/* Mock PM 2 — Mike Kowalski */}
  <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 opacity-55 cursor-default select-none">
    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">MK</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">Mike Kowalski</span>
        <span className="text-xs text-muted-foreground">Yesterday</span>
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">Permit approved — framing starts Monday</p>
    </div>
  </div>

  {/* Footer CTA */}
  <div className="px-4 py-5 text-center">
    <p className="text-xs text-muted-foreground">Real conversations appear here once team members message you.</p>
  </div>
</div>
```

The mock entries use `opacity-55`, `cursor-default`, and `select-none` so they're clearly non-interactive and distinguishable from real data.

Also remove the guard on line 213 that hides the FAB when `summaries.length === 0 && !ownerTeamId` — since the owner now always sees the example state, the bubble should always show for logged-in users:
```tsx
// Remove this line:
if (!isPM && summaries.length === 0 && !ownerTeamId) return null;
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/FloatingMessageBubble.tsx` | Increase width to `w-96`, height to `580px`. Replace empty-state with 2 example PM conversation rows + explanatory banner. Remove the FAB-hiding guard for owners. |

No database changes, no new files — purely UI/layout.

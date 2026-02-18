
## Make the Message Panel Bigger + Add New Chat with Examples for Team Tab

### What's Changing

Two things:
1. **Bigger panel** — increase the width from `w-80` (320px) to `w-96` (384px), and raise the max height from `480px` to `580px` so there's more room for messages
2. **Team tab example conversations** — when the Team tab is empty (no real messages yet), replace the plain "No messages yet" state with a realistic example conversation showing what the chat looks like with a sample PM

---

### 1. Bigger Panel — `FloatingMessageBubble.tsx`

**Current:**
```tsx
'w-80 sm:w-80',
// ...
style={{ height: view === 'thread' ? '480px' : 'auto', maxHeight: '480px' }}
```

**After:**
```tsx
'w-96 sm:w-96',
// ...
style={{ height: view === 'thread' ? '580px' : 'auto', maxHeight: '580px' }}
```

Also make the panel always use the full height (not just when in thread view) so the chat area feels consistent:
```tsx
style={{ height: '580px', maxHeight: '580px' }}
```

---

### 2. Example Chat Conversation in Team Tab

When the owner's `summaries.length === 0` (no real PMs have messaged yet), instead of a simple icon + text empty state, render an **example PM conversation card** that:

- Shows a mock PM entry (name "Jose R.", avatar initials "JR")
- Has a sample last message like `"I ordered the drywall materials — delivery confirmed for Thursday"`
- Shows a timestamp of "2h ago"
- Is visually styled as a grayed-out/preview card with a small "Example" badge so it's clear it's not real data
- Clicking it opens an example thread view (or just a note that says "Your real conversations will appear here when team members message you")

This way the owner immediately sees what the list will look like when populated.

**Example entry structure:**
```tsx
// Show example conversations when no real data
{summaries.length === 0 && (
  <div className="flex flex-col">
    <div className="px-4 py-2 border-b border-border/50 bg-muted/20">
      <span className="text-xs text-muted-foreground">Example — invite team members to start chatting</span>
    </div>
    {/* Example PM 1 */}
    <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 opacity-60 cursor-default">
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">JR</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Jose Rodriguez</span>
          <span className="text-xs text-muted-foreground">2h ago</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">Drywall delivery confirmed for Thursday</p>
      </div>
    </div>
    {/* Example PM 2 */}
    <div className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 opacity-60 cursor-default">
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">MK</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Mike Kowalski</span>
          <span className="text-xs text-muted-foreground">Yesterday</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">Permit approved — framing starts Monday</p>
      </div>
    </div>
    {/* Invite CTA */}
    <div className="px-4 py-4 text-center">
      <p className="text-xs text-muted-foreground">Real conversations appear here once team members message you.</p>
    </div>
  </div>
)}
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/FloatingMessageBubble.tsx` | 1) Increase panel width to `w-96`, max height to `580px`. 2) Replace empty-state with example PM list with 2 sample conversations |

No database changes needed — examples are purely static UI.

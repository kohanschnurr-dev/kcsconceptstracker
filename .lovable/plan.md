

## Plan: Improve "Sell Closing" Toggle Label

### Current State
The toggle currently reads: **"Sell Closing"** — which is abbreviated and may not be immediately clear to users.

### Recommended Rewording Options

| Option | Label Text | Clarity |
|--------|-----------|---------|
| **A (Recommended)** | "Include Exit Costs" | Clear, uses industry-standard "exit" terminology |
| **B** | "Add Selling Costs" | Action-oriented, explicit |
| **C** | "Exit/Sell Costs" | Covers both flip and rental terminology |
| **D** | "Include Resale" | Shorter, assumes flip context |

### Recommendation
**"Include Exit Costs"** is the best choice because:
- "Exit" is standard real estate investing terminology
- Works for both flips (selling) and rentals (refinancing out)
- The word "Include" makes the toggle's purpose clear
- Professional and concise

### File Change

**`src/components/budget/DealSidebar.tsx`** (line 174)

Change:
```tsx
<Label htmlFor="sell-closing-toggle" className="text-xs text-muted-foreground">
  Sell Closing
</Label>
```

To:
```tsx
<Label htmlFor="sell-closing-toggle" className="text-xs text-muted-foreground">
  Include Exit Costs
</Label>
```

This is a single-line text change that improves clarity without affecting functionality.



## Replace Pencil Emoji with Lucide Icon

### Change
In `src/components/budget/ContractorMarginGauge.tsx`, swap the `✏️` emoji button for a `Pencil` icon from `lucide-react` — small, grey, and styled consistently with the rest of the UI.

### Specific edits

**1. Add `Pencil` to the lucide import:**
```tsx
import { TrendingUp, CheckCircle2, AlertTriangle, DollarSign, Percent, Pencil } from 'lucide-react';
```

**2. Replace the emoji button with the icon:**
```tsx
// Before
<button onClick={...} className="leading-none opacity-60 hover:opacity-100 transition-opacity">✏️</button>

// After
<button onClick={...} className="leading-none opacity-50 hover:opacity-100 transition-opacity">
  <Pencil className="h-3 w-3" />
</button>
```

That's the only change — one import addition, one emoji swap. No logic, no layout, no other files.

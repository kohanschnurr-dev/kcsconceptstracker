
## Remove Mobile Bottom Navigation Bar

### What to Change

In `MainLayout.tsx`, remove:
1. The `MobileBottomNav` component block (lines 77–80)
2. The `MobileBottomNav` import (line 4)
3. The `expenseModalOpen` state and `projects` state + fetch — **only if** they are solely used for the bottom nav's `onAddClick`. The `QuickExpenseModal` (lines 82–88) uses them too, so those stay.
4. The bottom padding on the main content (`pb-24` on line 72) — this was only needed to prevent content from being hidden behind the fixed bottom nav. Without the nav, it should be `pb-4` (or just removed for mobile).

Also in `MainLayout.tsx`, the `QuickExpenseModal` that was triggered by the bottom nav's `+` button will remain since the `expenseModalOpen` state still exists — but nothing will trigger it anymore on mobile. We can safely remove the `expenseModalOpen` state, `projects` state, the `useEffect` that fetches projects, and the `QuickExpenseModal` entirely **only if** no other part of `MainLayout` uses them. Since they were all wired solely through the bottom nav's `onAddClick`, they can all be removed together.

### Files to Modify

| File | Change |
|---|---|
| `src/components/layout/MainLayout.tsx` | 1. Remove `MobileBottomNav` import. 2. Remove `expenseModalOpen` state, `projects` state, and `useEffect` fetch. 3. Remove `MobileBottomNav` JSX block. 4. Remove `QuickExpenseModal` JSX block. 5. Change `pb-24` to `pb-4` on the main content wrapper. |

### Code Change

```tsx
// Remove these imports:
import { MobileBottomNav } from './MobileBottomNav';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import type { Project, CategoryBudget } from '@/types';

// Remove these states:
const [expenseModalOpen, setExpenseModalOpen] = useState(false);
const [projects, setProjects] = useState<Project[]>([]);

// Remove the entire useEffect that fetches projects

// Remove from JSX:
<div className="lg:hidden">
  <MobileBottomNav onAddClick={() => setExpenseModalOpen(true)} />
</div>

<QuickExpenseModal ... />

// Change pb-24 → pb-4 on mobile:
<div className="min-h-screen p-4 pt-20 pb-4 lg:p-8 lg:pt-8 lg:pb-8">
```

One file. Clean removal — no orphaned state or imports left behind.


## Plan: Make Category Breakdown Text White

### Overview
Update the Category Breakdown dialog text to be white for better visibility on the dark background, following the KCS Concepts styling guidelines (white text on dark backgrounds).

---

### Current vs. Proposed

| Element | Current | Proposed |
|---------|---------|----------|
| Category names | `text-sm` (inherits muted gray) | `text-sm text-white` |
| Currency amounts | `text-sm font-mono font-medium` | `text-sm font-mono font-medium text-white` |
| Tooltip text | Uses theme defaults | Explicit white text |

---

### Changes

**File: `src/components/ops/CategoriesPopout.tsx`**

#### 1. Category name text (Line 121)

Change from:
```tsx
<span className="text-sm">{cat.name}</span>
```

To:
```tsx
<span className="text-sm text-white">{cat.name}</span>
```

#### 2. Currency amount text (Line 124)

Change from:
```tsx
<span className="text-sm font-mono font-medium">{formatCurrency(cat.value)}</span>
```

To:
```tsx
<span className="text-sm font-mono font-medium text-white">{formatCurrency(cat.value)}</span>
```

#### 3. Tooltip text styling (Lines 97-103)

Add `itemStyle` and `labelStyle` for white tooltip text:
```tsx
<Tooltip 
  formatter={(value: number) => formatCurrency(value)}
  contentStyle={{ 
    backgroundColor: 'hsl(var(--card))', 
    border: '1px solid hsl(var(--border))' 
  }}
  itemStyle={{ color: '#FFFFFF' }}
  labelStyle={{ color: '#FFFFFF' }}
/>
```

---

### Visual Result

The category list will now display with crisp white text:
- **Online Course Materials** - $1,005 (32%)
- **Continuing Education Classes** - $747 (24%)
- etc.

All text fully readable on the dark background.

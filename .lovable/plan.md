

## Plan: Add hover animation to module icon pills and icons

**File**: `src/components/landing/PlatformOverview.tsx`

Add interactive hover effects to the icon container (pill) and the icon inside each module card:

1. **Icon container (pill)**: Scale up slightly and increase background opacity on card hover
2. **Icon (emoticon)**: Add a subtle rotate + scale effect on card hover

Using Tailwind's `group-hover` since the cards already have the `group` class:

```tsx
{/* Icon container */}
<div className={`shrink-0 w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
  <Icon className={`w-5 h-5 ${m.color} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`} />
</div>
```

Same treatment for the "And More…" Sparkles card.




## Plan: Move bounce to lower half

Tailwind's default `animate-bounce` uses `translateY(-25%)` which makes the element bounce **upward**. To bounce **downward** instead, I'll add a custom `animate-bounce-down` keyframe in `tailwind.config.ts` (or `index.css`) and swap the class on the chevron.

**Changes:**

1. **`src/index.css`** — Add a `bounce-down` keyframe that translates downward instead of upward:
   ```css
   @keyframes bounce-down {
     0%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
     50% { transform: translateY(25%); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
   }
   .animate-bounce-down { animation: bounce-down 1s infinite; }
   ```

2. **`src/components/landing/Hero.tsx`** — Change `animate-bounce` → `animate-bounce-down` on the `ChevronDown` icon.


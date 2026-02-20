

## Fix Checklist & Daily Logs Tab Alignment

### Problem

The "Checklist / Daily Logs" tabs and the "Master Pipeline / Daily Sprint" sub-tabs look misaligned inside their gray pill containers. The tab triggers don't fill the container height properly, leaving awkward gaps and making the active tab appear to float inside the gray bar.

### Solution

Add explicit height and alignment classes to both TabsList containers and their triggers so the active pill fills the bar cleanly.

### Technical Details

**`src/pages/DailyLogs.tsx`**

1. **Top-level tabs (line 572)**: Add `h-12 md:h-10` to the `TabsList` so the container has a consistent height, and add `h-10 md:h-8` to each `TabsTrigger` (lines 573, 577) so the active pill fills the bar.

2. **Sub-level tabs (line 767)**: Same approach -- add `h-12 md:h-10` to the sub-tab `TabsList` and `h-10 md:h-8` to each sub-tab `TabsTrigger` (lines 768, 778) so Master Pipeline and Daily Sprint pills align flush inside the gray bar.

This ensures triggers fill their container vertically, eliminating the floating/misaligned look on both mobile and desktop.


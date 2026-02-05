

## Plan: Remove "Week at a Glance" Widget

### Overview
Remove the CalendarGlanceWidget from the dashboard as it's not providing useful value.

---

### Changes Required

**File: `src/pages/Index.tsx`**

1. **Remove import** (line 11):
   ```tsx
   // DELETE: import { CalendarGlanceWidget } from '@/components/dashboard/CalendarGlanceWidget';
   ```

2. **Remove the right sidebar section** (lines 316-321):
   ```tsx
   // DELETE entire block:
   {/* Right Sidebar - Urgent Tasks & Calendar */}
   <div className="hidden lg:block w-72 flex-shrink-0">
     <div className="sticky top-6">
       <CalendarGlanceWidget refreshKey={taskRefreshKey} />
     </div>
   </div>
   ```

3. **Simplify layout** (line 244):
   - The parent `flex` container can remain as-is since removing the sidebar will let the main content expand naturally to full width

---

### Optional Cleanup

**File: `src/components/dashboard/CalendarGlanceWidget.tsx`**
- Can be deleted entirely if not used elsewhere
- This component is only imported in `Index.tsx`

---

### Result
- Dashboard main content will expand to use full width on large screens
- Cleaner layout without the underutilized sidebar widget
- The TasksDueTodayBanner already provides calendar/event visibility in a more prominent location


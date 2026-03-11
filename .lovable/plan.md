

## Plan: Replace Gantt Bar Text with Category Emoji

The Gantt bar content (icon + title text) is always truncated and unreadable. Replace it with a single emoji that represents the event category.

### Changes

**File: `src/components/calendar/GanttView.tsx`**

1. Add a `getCategoryEmoji` function that maps category keywords/groups to relevant emoji:
   - plumbing → 🔧, electrical → ⚡, hvac → ❄️, paint → 🎨, framing/demo → 🔨, flooring → 🪵, tile → 🔲, cabinet → 🗄️, window/door → 🚪, inspect/permit → ✅, clean/stage → ✨, fence → 🏗️, landscape → 🌳, foundation → 🏛️, insulation → 🛡️, drywall → 🖌️, roof/siding → 🏠, listing/closing → 📅, order/delivery → 📦, utilities → 💡, rent → 💰
   - Fallback by group: acquisition_admin → 📄, structural_exterior → 🏠, rough_ins → 🔧, inspections → ✅, interior_finishes → 🎨, milestones → 📅
   - Default → 🔧

2. Replace the bar content (lines 222-226) from:
   ```tsx
   <div className="flex items-center h-full px-2 gap-1">
     {getCategoryIcon(task.eventCategory || 'due_diligence')}
     <span className="text-[10px] text-white font-medium truncate">
       {task.title}
     </span>
   </div>
   ```
   To:
   ```tsx
   <div className="flex items-center justify-center h-full text-xs">
     {getCategoryEmoji(task.eventCategory || 'due_diligence')}
   </div>
   ```

The tooltip already shows the full task name on hover, so no information is lost.


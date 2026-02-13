

## Replace Emojis with Lucide Icons for Custom Trade Groups

### What Changes
Custom trade groups currently use colored Unicode emojis (e.g., "🏠", "💰") while built-in groups use monochrome Lucide vector icons. This change replaces the emoji system with a Lucide icon mapping, so all groups -- built-in and custom -- have the same consistent vector icon style.

### Technical Details

**`src/lib/budgetCalculatorCategories.ts`**:
- Replace the `EMOJI_MAP` (string-to-emoji mapping) with an `ICON_MAP` (string-to-LucideIcon mapping), e.g.:
  - `purchase/buy/acquire` -> `Home`
  - `sale/sell/profit` -> `DollarSign`
  - `finance/loan/mortgage` -> `Banknote`
  - `labor/crew/contractor` -> `HardHat`
  - `legal/attorney` -> `Scale`
  - `insurance` -> `Shield`
  - `tax/taxes` -> `Receipt`
  - `holding/carry` -> `Clock`
  - `rehab/renovation/construction` -> `Hammer`
  - `utility/utilities` -> `Zap`
  - `inspection/inspect` -> `Search`
  - `permit/permits` -> `ClipboardList`
  - `design/architect` -> `Palette`
  - `title/escrow` -> `FileText`
  - `marketing/advertising` -> `Megaphone`
  - `office` -> `Building2`
  - `land/lot` -> `MapPin`
  - `closing/close` -> `FileSignature`
  - `pre-close/preclose` -> `Key`
  - Default fallback -> `Package`
- Change `pickEmoji` to `pickIcon` returning a `LucideIcon` instead of a string
- Remove the `emoji` field from `CustomGroupEntry` and `BudgetCalcGroupDef` interfaces; custom groups will just use the `icon` field directly
- Update `loadCustomGroups()` to call `pickIcon(label)` for the icon instead of storing an emoji

**`src/components/budget/BudgetCanvas.tsx`**:
- Remove the emoji conditional rendering block -- always render `<GroupIcon>` since all groups now have proper Lucide icons

**`src/components/settings/ManageSourcesCard.tsx`**:
- Update custom group creation to use `pickIcon` instead of `pickEmoji`
- Remove emoji references when saving/displaying custom groups

### No Database Changes
All icon mapping is done at render time based on the group label, so existing saved custom groups will automatically get their matching icons.


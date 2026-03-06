

## Update PlatformOverview Module Grid

### Change in `src/components/landing/PlatformOverview.tsx`

Update the `modules` array:
1. Remove "Vendor Compliance" entry
2. Reorder so Smart Notifications comes before QuickBooks Sync
3. Add an "And More..." card as the final item (matching the style used in FeaturesGrid — with a Sparkles icon and a link to `/features`)

Final order of the last row: Real-Time Messaging → Smart Notifications → QuickBooks Sync → And More...

### Files
- `src/components/landing/PlatformOverview.tsx` — remove Vendor Compliance, reorder, add "And More" card


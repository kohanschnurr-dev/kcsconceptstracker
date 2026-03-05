

## Remove Trade Types from Scope of Work Sheet

Remove the entire "Trade Types" UI block from `src/components/vendors/ScopeOfWorkSheet.tsx` — the badge list, the text input, and the Add button. Also remove the related state variables (`tradeTypes`, `tradeInput`) and helper functions (`removeTrade`, `addTrade`), and strip trade types from `buildContent()` and `getPdfOptions()`.

### Changes in `src/components/vendors/ScopeOfWorkSheet.tsx`
1. Remove state: `tradeTypes`, `tradeInput`
2. Remove reset lines in `handleOpenChange`: `setTradeTypes([])`, `setTradeInput('')`
3. Remove `removeTrade` and `addTrade` functions
4. Remove the entire Trade Types JSX block (~25 lines) under Job Details
5. Remove `tradeTypes` from `buildContent()` and `getPdfOptions()`

Single file change.


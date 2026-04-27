# Straighten Capital Stack project labels

In `src/components/loans/LoanCharts.tsx`, update the Capital Stack `<XAxis>`:

- Remove `angle={-35}` and change `textAnchor` from `"end"` to `"middle"` so project names render horizontally and centered under each bar.
- Reduce `height` from `80` → `50` and the `BarChart` `margin.bottom` from `78` → `48` to reclaim the space the diagonal labels were using.

No other changes. With 5 short project names at the current viewport this fits cleanly; if a name is unusually long it will simply be truncated by Recharts' tick rendering (consistent with other charts in the app).

Tip for future tweaks like this: you can use **Visual Edits** (Edit button bottom-left of the chat box) to change text, colors, and simple layout properties on static elements without spending credits.

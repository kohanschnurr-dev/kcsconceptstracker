## Goal

Replace the three inline buttons (Mark Paid Off / Delete / Edit) in the loan detail header with a single 3-dot (kebab) icon button that opens a dropdown menu containing those same actions.

## Changes

**`src/pages/LoanDetail.tsx`**
- Replace the `flex items-center gap-2` button cluster (lines ~244–261) with a single `DropdownMenu`.
- Trigger: ghost icon button using `MoreVertical` from lucide-react (matches existing 1px-border, sharp-corner aesthetic).
- Menu items (in order):
  1. **Edit** — `Edit2` icon, opens `setEditOpen(true)`.
  2. **Mark Paid Off** — `CheckCircle2` icon, calls `handleMarkPaidOff`. Only rendered when `loan.status === 'active'`.
  3. Separator.
  4. **Delete** — `Trash2` icon, `text-destructive` styling, opens `setDeleteOpen(true)`.
- Use the existing shadcn `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` from `@/components/ui/dropdown-menu`.
- Add `MoreVertical` to the existing lucide-react import; keep `Edit2`, `CheckCircle2`, `Trash2` (still used inside menu items).
- Align menu to the end (`align="end"`) so it opens flush under the trigger.

## Out of scope

- No changes to the underlying actions (edit modal, delete confirmation, mark-paid-off mutation) — only the entry point UI changes.
- No changes to `LinkedLoanCard` in `ProjectLoanTab.tsx` (different surface, smaller action set).
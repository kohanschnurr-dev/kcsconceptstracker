

## Reorder Fields and Add Auto-Populate in New Project Modal

### Changes to `src/components/NewProjectModal.tsx`

**1. Swap field order**: Move the Address field above the Project Name field.

**2. Add auto-populate button**: Add a small button next to the Project Name label that copies the current address value into the project name field. This button will only appear when the address field has a value.

### Technical Details

- Move the Address `<div>` block (currently around lines 147-156) above the Project Name block (lines 137-146)
- Add a clickable button/icon next to the "Project Name" label that sets `name` to the current `address` value
- Use a small icon button (e.g., `Copy` or `ArrowUp` from lucide-react) with a tooltip or label like "Use address"
- The button is hidden when address is empty

### UI Result

```
Project Type: [Fix & Flip] [Rental] [New Build] [Wholesale]

Address *
[pin] 2112 Treehouse Ln

Project Name *                    [Use Address ->]
Tree House Ln

Total Budget *    Start Date
...
```


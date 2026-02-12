

## Auto-Assign Emoji to Custom Trade Groups

### What Changes
When you create a new trade group (e.g., "Purchase & Sale"), the system will automatically pick a relevant emoji and display it as the group's icon in the Budget Calculator canvas.

### How It Works

**1. Add emoji field to custom group data** (`src/lib/budgetCalculatorCategories.ts`)
- Extend `CustomGroupEntry` to include an `emoji` field
- Extend `BudgetCalcGroupDef` to include an optional `emoji` field
- Update `loadCustomGroups()` to carry over the emoji from storage
- Add an `EMOJI_MAP` lookup that maps common keywords to emojis (e.g., "purchase" -> "🏠", "sale" -> "💰", "closing" -> "📝", "pre-close" -> "🔑", "finance" -> "💵", "labor" -> "👷", etc.) with a default fallback of "📦"
- Add a `pickEmoji(label: string)` function that checks each word in the group name against the map and returns the first match (or the default)

**2. Auto-assign emoji on group creation** (`src/components/settings/ManageSourcesCard.tsx`)
- In `handleAddGroup`, call `pickEmoji(trimmed)` to auto-select an emoji
- Store it alongside `key` and `label` in the `CustomGroupEntry`

**3. Display emoji in Budget Canvas group headers** (`src/components/budget/BudgetCanvas.tsx`)
- In the group header row, check if the group definition has an `emoji` field
- If yes, render the emoji as a `<span>` instead of the Lucide `<GroupIcon>` component
- Built-in groups (Structure, MEPs, etc.) continue to use their Lucide icons as before

### Keyword-to-Emoji Map (examples)

```text
purchase -> 🏠    sale / sell  -> 💰
closing  -> 📝    pre-close   -> 🔑
finance / loan -> 💵   labor   -> 👷
land     -> 🌍    legal       -> ⚖️
marketing -> 📣   office      -> 🏢
insurance -> 🛡️   tax         -> 🧾
default fallback -> 📦
```

### Files Modified
- `src/lib/budgetCalculatorCategories.ts` — data model + emoji picker
- `src/components/settings/ManageSourcesCard.tsx` — auto-assign on creation
- `src/components/budget/BudgetCanvas.tsx` — render emoji for custom groups


## Plan: Remove "Move to:" Target Bar

### Overview
Remove the `FolderTargetBar` component that appears when dragging documents or folders. Users will instead drag items directly onto folder cards in the grid, which already support receiving drops.

---

### Current Behavior
When you start dragging a document:
1. A "Move to:" bar appears at the top with folder chips
2. Users can drop onto those chips OR onto folder cards in the grid

The bar creates visual clutter and duplicates functionality already present on folder cards.

---

### Proposed Behavior
- Remove the "Move to:" bar entirely
- Users drag documents/folders directly onto the folder cards in the grid
- Folder cards already highlight when hovered during drag (ring + "Drop here" overlay)
- For moving items out of a folder to root, show a small root drop zone at the top only when inside a folder during a drag

---

### Technical Changes

**File: `src/components/project/DocumentsGallery.tsx`**

1. Remove the `FolderTargetBar` import
2. Remove the `<FolderTargetBar ... />` component usage
3. Update the RootDropZone to show during drag when inside a folder (for moving to root):
   - Change condition from `currentFolderId && !activeDragId` to `currentFolderId && activeDragId`

---

### Visual Comparison

**Before (dragging):**
```text
┌──────────────────────────────────────────────────────────────────────┐
│ Move to:                                                              │
│ [🏠 Root] [📁 Foundation Documents]                                   │
└──────────────────────────────────────────────────────────────────────┘
┌────────────────┐  ┌──────────────────────────────────────────────────┐
│ Foundation     │  │  📄 SDN 718 Chaparral Trail.pdf  (DRAGGING)      │
│ Documents      │  │                                                  │
│ 2 files        │  └──────────────────────────────────────────────────┘
└────────────────┘
```

**After (dragging):**
```text
┌────────────────┐  ┌──────────────────────────────────────────────────┐
│ Foundation     │  │  📄 SDN 718 Chaparral Trail.pdf  (DRAGGING)      │
│ Documents      │◀─│                                                  │
│ 2 files        │  └──────────────────────────────────────────────────┘
│  Drop here     │
└────────────────┘
```

When inside a folder and dragging, only a small root zone shows at top:
```text
┌──────────────────────────────────────────────────────────────────────┐
│ ↑ Drag here to move out of folder                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/project/DocumentsGallery.tsx` | Remove FolderTargetBar import and usage; update RootDropZone to show during drag |

---

### Expected Result
- Cleaner, less cluttered drag-and-drop experience
- Direct visual feedback when hovering over folder cards
- RootDropZone only appears when inside a folder and actively dragging

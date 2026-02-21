

## Upgrade Add Task Dialog -- Photos, Size, and Line Items

### What's Changing

Three improvements to the `AddTaskDialog` component used on Dashboard and Daily Logs:

### 1. Replace Photos Section with PasteableTextarea

Remove the standalone camera-button photo uploader and replace the Description textarea with `PasteableTextarea`. This merges description and photos into one area -- users can type notes AND paste/drag-drop images directly, matching the pattern already used in the Edit Task dialog on the Project Tasks page.

- Removes: the hidden file input, `handleFileSelect`, Camera button, manual photo grid
- Adds: `PasteableTextarea` with `bucketName="task-photos"`, passing `photoUrls` and `setPhotoUrls`
- Users get: Ctrl+V paste, drag-and-drop, plus the existing click-to-upload camera button within the thumbnail strip
- The "Tip: Paste images with Ctrl+V or drag and drop" hint renders automatically

### 2. Make the Dialog Larger

Change `sm:max-w-md` to `sm:max-w-lg` on `DialogContent` so the modal has more breathing room for the new features.

### 3. Add Line Items Feature

Add a "Line Items" section below Description/Photos. Users can add multiple line items, each with a text description and an optional dollar amount. This is useful for breaking tasks into sub-steps or listing materials/costs.

- New state: `lineItems` as an array of `{ text: string; amount: string }`
- UI: Each line item row has a text input and a dollar amount input side by side, with an X button to remove
- "+ Add Line Item" button at the bottom of the list
- Line items are saved as JSON in the task's `description` field (appended after the main description text, separated by a delimiter), or stored in a `line_items` JSON column if available
- Since the `tasks` table likely doesn't have a dedicated `line_items` column, we'll encode them into the description as a structured block (e.g., `---LINE_ITEMS---` delimiter followed by JSON) so no database migration is needed. This keeps it simple and backwards-compatible.

### Technical Details

**File: `src/components/dashboard/AddTaskDialog.tsx`**

1. Import `PasteableTextarea` from `@/components/PasteableTextarea`
2. Remove: `Camera`, `X` icon imports (keep `Loader2`, `X` for line items), `fileInputRef`, `handleFileSelect`, `isUploading` state
3. Change `DialogContent` class from `sm:max-w-md` to `sm:max-w-lg`
4. Replace the Description `Textarea` with `PasteableTextarea` configured with `bucketName="task-photos"`, `uploadedImages={photoUrls}`, `onImagesChange={setPhotoUrls}`
5. Remove the entire Photos section (lines 167-184)
6. Add `lineItems` state: `useState<{ text: string; amount: string }[]>([])`
7. Add Line Items UI section after the PasteableTextarea:
   - Label: "Line Items (optional)"
   - Each row: text Input (flex-1) + amount Input (w-24, prefixed with $) + X remove button
   - "+ Add Line Item" button
8. Update `handleSave`: encode line items into description if any exist (append after main text with delimiter)
9. Update `resetForm`: clear `lineItems`

### Files Changed

- `src/components/dashboard/AddTaskDialog.tsx` -- replace photos with PasteableTextarea, enlarge dialog, add line items feature


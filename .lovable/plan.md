

## Remove "Text" and "Mark DNC" Buttons from CRM Contact Detail

### Changes

**`src/pages/CRMContactDetail.tsx`**

1. **Remove the "Text" button** (~line 168-170): Delete the `<Button>` wrapping the `sms:` link.

2. **Remove the "Mark DNC" button** (~line 174-178): Delete the conditional block rendering the DNC button.

3. **Remove the DNC confirmation dialog** (~lines 447-459 area): Delete the `AlertDialog` for DNC confirmation.

4. **Remove the `handleMarkDNC` function** (~lines 107-110) and `dncConfirm` state variable.

5. **Clean up unused imports**: Remove `Ban`, `MessageSquare` if no longer referenced elsewhere in the file.

No other files need changes — these buttons only appear on the contact detail page.




## Remove Phone Call Links — Make Numbers Static Text

### Problem
Clicking phone numbers triggers the browser's "Open Pick an app?" dialog. The user wants phone numbers displayed as plain text with no click-to-call behavior.

### Changes

**1. `src/components/crm/ContactsView.tsx`**
- Replace the `<a href="tel:...">` link with a plain `<span>` for the phone number in the contacts table.

**2. `src/components/crm/PipelineView.tsx`**
- Replace the `<a href="tel:...">` link with a plain `<span>` on the pipeline card phone display.

**3. `src/pages/CRMContactDetail.tsx`** (4 instances)
- Remove the "Call" button that wraps `<a href="tel:...">`.
- Replace the 3 phone `<a>` tags in the info grid and detail card with plain `<span>` elements.

**4. `src/pages/Vendors.tsx`**
- Replace the `<a href="tel:...">` link with a plain `<span>` for vendor phone numbers.

All styling (icons, text size, colors) will be preserved — only the clickable `tel:` link behavior is removed.


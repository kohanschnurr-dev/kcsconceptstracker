

## Fix: QuickBooks Popup Not Communicating Back to App

**Root cause:** Message type mismatch between the edge function and the client hook.

- **Edge function** (`quickbooks-auth/index.ts` line 221): sends `window.opener.postMessage({ type: 'quickbooks-connected' }, '*')`
- **Client hook** (`useQuickBooks.ts` line 215): listens for `event.data?.type === 'quickbooks-callback'`

These don't match, so the popup's success message is ignored. The popup stays open showing raw HTML, and the app never learns the connection succeeded.

**Fix in `src/hooks/useQuickBooks.ts` (line 215):**

Change the message listener to match what the edge function actually sends:

```ts
if (event.data?.type === 'quickbooks-connected') {
```

Single line change. Everything else (token storage, sync, etc.) is working correctly — the connection itself succeeded as shown in the screenshot.


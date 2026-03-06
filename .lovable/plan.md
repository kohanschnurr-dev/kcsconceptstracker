

## Add Back Arrow to Auth Page

Add a back-to-landing arrow button at the top of the Auth page's right panel, so users who clicked "Log In" from the landing page can easily return.

### Changes

**`src/pages/Auth.tsx`**
- Import `ArrowLeft` from lucide-react
- Add a back button at the top of the right panel (above the mobile logo / tab toggle), using `navigate('/')` to return to the landing page
- Style: subtle ghost button with `ArrowLeft` icon + "Back" text, positioned top-left of the right panel


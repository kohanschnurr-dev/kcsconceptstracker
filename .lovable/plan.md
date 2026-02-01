
## Plan: Update Auth Page Branding and Improve Sign-up Flow

### Part 1: Branding Updates

**Changes to make:**

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Change "FlipTracker DFW" to "FlipTracker" |
| `src/pages/Auth.tsx` | Update subtitle from "Construction budget tracking for DFW investors" to "Construction budget tracking for fix & flip investors" |
| `index.html` | Update title and meta tags to remove "DFW" references |

### Part 2: Improve Sign-up Confirmation Flow

**Current Issue:** When users sign up, they only see a brief success message. There's no clear guidance about what happens next (email verification, etc.) and the flow doesn't feel "intelligent" or guiding.

**Improvements:**

1. **After successful sign-up:**
   - Show a more prominent confirmation message
   - Auto-switch to the Sign In tab so users know where to go
   - Display clearer instructions about checking email if email confirmation is enabled

2. **Better error handling:**
   - Add specific handling for common sign-up errors
   - Show friendlier messages for rate limits, weak passwords, etc.

3. **Password confirmation field (optional enhancement):**
   - Add a "Confirm Password" field on sign-up to prevent typos

### Technical Implementation

**File: `src/pages/Auth.tsx`**

```typescript
// Update branding
<span className="text-2xl font-bold">FlipTracker</span>
<p className="text-muted-foreground text-center">
  Construction budget tracking for fix & flip investors
</p>

// Add password confirmation to schema
const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Improved success handling
const handleSignUp = async (data: AuthFormData) => {
  // ... existing logic
  if (!error) {
    setSuccessMessage('Account created successfully! Please check your email to verify your account, then sign in.');
    reset();
    // Auto-switch to sign in tab
    setActiveTab('signin');
  }
};
```

**File: `index.html`**

```html
<title>FlipTracker | Fix & Flip Budget Tracker</title>
<meta name="description" content="Track construction budgets, expenses, vendors, and daily logs for your fix and flip renovation projects." />
<meta property="og:title" content="FlipTracker - Fix & Flip Budget Tracker" />
<meta property="og:description" content="Track construction budgets, expenses, vendors, and daily logs for your fix and flip renovation projects." />
```

### Summary of Changes

| Area | Before | After |
|------|--------|-------|
| App title | FlipTracker DFW | FlipTracker |
| Subtitle | "for DFW investors" | "for fix & flip investors" |
| Sign-up form | Single password field | Password + Confirm password fields |
| Success message | Brief text | Clear instructions + auto-switch to Sign In tab |
| Tab control | Uncontrolled | Controlled (to enable auto-switching) |



## Improve Landing Page FAQ

**File:** `src/components/landing/FAQ.tsx`

Replace the current 6 FAQs with more polished, conversion-focused questions and answers that address real buyer objections for a construction project management tool. Also fix the "Is my data secure?" answer to not mention Supabase (internal implementation detail).

**Updated FAQ list:**

1. **What types of projects does GroundWorks support?** — Fix & flips, rental rehabs (BRRR), remodels. Built for investors and contractors tracking budgets, subs, and timelines.

2. **How does QuickBooks integration work?** — Connect your account, expenses sync automatically. Categorize, split across projects, batch-import. Duplicate detection built in.

3. **Can my project managers use the app too?** — Yes. Invite via email, assign granular role-based permissions. PMs can submit order requests for your approval.

4. **Is my data secure?** — Rewrite to remove "Supabase" mention. Use: enterprise-grade encryption, row-level security, secure file storage, no third-party data sharing.

5. **Do I need to be tech-savvy to use it?** — New. Emphasize simplicity, 3-minute setup, no training needed.

6. **Can I generate documents and reports?** — Keep. Branded PDFs, receipts, invoices, scope of work, daily logs, budget breakdowns.

7. **What's included in the free trial?** — Keep. Full access, 7 days, no credit card.

8. **What if I need help getting started?** — New. Mention support, onboarding assistance.

Also convert the FAQ from custom accordion to use the existing `Accordion` component from `@radix-ui/react-accordion` for smoother open/close animations (matching Pricing page pattern).




## Landing Page Design Prompt for LLM

Copy and paste the following prompt into a new Lovable project (or your preferred LLM tool) to build your marketing site:

---

### PROMPT START

Build a 3-page dark-themed SaaS marketing website for **FlipTracker by KCS Concepts** — a real estate investment management platform. The site sells monthly subscriptions at **$90/month** or **$78/month billed annually ($936/year)**. Include a **14-day free trial**.

**Tech stack**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui components.

---

#### DESIGN SYSTEM

- **Theme**: Dark background (#0f1117 or similar deep dark), glass-morphism cards with subtle borders and backdrop blur, accent color green (#22c55e) for CTAs and success states
- **Typography**: Clean sans-serif (Inter or system font stack), large hero headings (48-64px), generous line height
- **Cards**: Rounded corners (12-16px), subtle border (1px white/10%), glass effect background (white/5% with backdrop-blur)
- **Buttons**: Primary = green gradient or solid green, Secondary = outlined/ghost, rounded-md, hover transitions
- **Spacing**: Generous whitespace between sections, 80-120px vertical padding per section
- **Animations**: Subtle fade-in-up on scroll for sections, smooth hover states on cards and buttons

---

#### PAGE 1: LANDING PAGE (/)

**Hero Section**
- Large headline: "Track Every Dollar. Maximize Every Flip."
- Subheadline: "The all-in-one budget tracker built for fix & flip investors, BRRRR strategists, and rental property managers."
- Two CTAs: "Start Free Trial" (green, primary) and "See Pricing" (outlined, secondary)
- Hero visual: A stylized dark-mode screenshot/mockup of the app dashboard showing budget tracking

**Social Proof Bar**
- Placeholder for metrics: "500+ Projects Tracked", "$50M+ in Budgets Managed", "4.9/5 Rating"
- Use placeholder logos for partner/integration badges (QuickBooks logo placeholder)

**Feature Overview Section (3-column grid)**
- Card 1: **Budget & Profit Analysis** — "Build deal budgets with MAO calculator, BRRRR analysis, and real-time profit tracking. Know your numbers before you buy."
- Card 2: **Expense Management** — "Scan receipts with AI, auto-split costs across categories, sync with QuickBooks, and track every transaction."
- Card 3: **Project Management** — "Manage tasks, vendors, daily logs, calendars, procurement, and documents — all tied to each project."
- Each card gets a relevant icon (lucide-react icons: Calculator, Receipt, ClipboardList)
- CTA below: "Explore All Features" linking to /features

**How It Works Section (3 steps)**
- Step 1: "Create a Project" — Add your property details, purchase price, and ARV
- Step 2: "Build Your Budget" — Use templates or custom categories to plan every cost
- Step 3: "Track & Profit" — Log expenses, monitor spending, and see real-time profit analysis
- Visual: numbered steps with connecting line/dots

**Testimonial Section**
- 3 placeholder testimonial cards with avatar circles, fake names, titles ("Real Estate Investor, Atlanta GA"), and placeholder quotes about saving time and tracking budgets
- Use glass-card styling

**CTA Banner**
- Full-width section: "Ready to take control of your rehab budgets?"
- "Start Your 14-Day Free Trial" button (green)
- Small text: "No credit card required"

**Footer**
- Logo, navigation links (Features, Pricing, Login, Contact)
- Placeholder links: Privacy Policy, Terms of Service
- Copyright: "(c) 2025 KCS Concepts. All rights reserved."

---

#### PAGE 2: FEATURES PAGE (/features)

**Hero**
- Headline: "Everything You Need to Run Profitable Rehabs"
- Subheadline: "From deal analysis to final sale — one platform for your entire investment workflow."

**Feature Sections (alternating layout: text-left/image-right, then text-right/image-left)**

Section 1: **Deal Analysis & Budget Calculator**
- MAO (Maximum Allowable Offer) calculator
- BRRRR rental analysis with cash-on-cash return
- Customizable budget templates (fix & flip, rental, new construction)
- %/$ toggle for closing and holding cost estimates
- Profit breakdown with adjustable cost modes

Section 2: **Smart Expense Tracking**
- AI-powered receipt scanning (photo or paste)
- Smart split across multiple categories
- QuickBooks integration for automatic sync
- CSV import for bulk expense entry
- Cost type tagging (construction, transaction, holding)

Section 3: **Project Management Suite**
- Task management with due dates and assignments
- Interactive calendar with Gantt view
- Daily construction logs
- Vendor management and compliance tracking
- Document storage with folder organization

Section 4: **Reporting & Insights**
- Spending trend charts and category breakdowns
- Profit potential dashboard across all projects
- Export reports for lenders and partners
- Budget vs. actual comparison per category

Section 5: **Team Collaboration**
- Multi-user access with role management
- Team member invitations via email
- Shared project visibility
- Activity tracking across team members

Each section should have a placeholder for a dark-mode app screenshot/mockup on the visual side.

**Bottom CTA**: "Start Your Free Trial" with pricing teaser ("Plans start at $78/month")

---

#### PAGE 3: PRICING PAGE (/pricing)

**Hero**
- Headline: "Simple, Transparent Pricing"
- Subheadline: "One plan, all features. No hidden fees."

**Pricing Toggle**
- Monthly / Annual toggle switch
- Annual shows "Save 13%" badge

**Pricing Card (single plan, centered)**
- Plan name: "FlipTracker Pro"
- Monthly: $90/mo
- Annual: $78/mo (billed as $936/year)
- Feature checklist (checkmarks):
  - Unlimited projects
  - AI receipt scanning
  - Budget calculator with MAO & BRRRR
  - QuickBooks integration
  - Team collaboration
  - Document storage
  - Task & calendar management
  - Daily construction logs
  - Vendor tracking
  - Export reports
  - Email support
- CTA: "Start 14-Day Free Trial"
- Subtext: "No credit card required. Cancel anytime."

**FAQ Section (accordion)**
- "What happens after my free trial?"
- "Can I cancel anytime?"
- "Do you offer refunds?"
- "How many projects can I create?"
- "Is my data secure?"
- "Do you integrate with QuickBooks?"
- "Can I add team members?"
- Use placeholder answers that are professional and reassuring

**Bottom CTA**: Same as landing page CTA banner

---

#### GLOBAL ELEMENTS

**Navigation Bar**
- Logo (left): "FlipTracker" text or KCS Concepts logo
- Links (center/right): Features, Pricing
- CTAs (right): "Login" (ghost button), "Start Free Trial" (green button)
- Sticky/fixed on scroll with backdrop blur
- Mobile: hamburger menu

**Mobile Responsive**
- All sections stack vertically on mobile
- Feature grid becomes single column
- Pricing card fills width
- Navigation collapses to hamburger

---

#### IMPORTANT NOTES
- This is a marketing/landing site ONLY — no actual app functionality
- Use placeholder images (dark gradient rectangles with subtle UI mockup outlines) where screenshots are needed
- All CTAs should link to a signup page or anchor (placeholder href="#signup" for now)
- Keep the code clean and component-based for easy iteration
- Use lucide-react for all icons
- Ensure the site scores well on Lighthouse (semantic HTML, alt tags, proper heading hierarchy)

### PROMPT END

---

### Implementation Note

When you're ready to process payments, come back to this project and we can set up Stripe to handle subscriptions ($90/month and $78/month annual). The backend is already set up through Lovable Cloud to manage user accounts and transactions.


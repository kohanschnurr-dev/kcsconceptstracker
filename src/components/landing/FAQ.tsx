import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What types of projects does GroundWorks support?",
    a: "GroundWorks is built for residential construction — fix & flips, rental rehabs (BRRR), new builds, and remodels. If you're tracking budgets, managing subs, and hitting timelines on construction projects, it's built for you.",
  },
  {
    q: "How does QuickBooks integration work?",
    a: "Connect your QuickBooks account and GroundWorks syncs your expenses automatically. Categorize them, split costs across multiple projects, and batch-import with one click. Built-in duplicate detection ensures nothing gets counted twice.",
  },
  {
    q: "Can my project managers use the app too?",
    a: "Absolutely. Invite team members via email and assign roles with granular permissions — control who can view projects, manage expenses, handle procurement, and more. PMs can submit order requests that you approve directly from your dashboard.",
  },
  {
    q: "Is my data secure?",
    a: "GroundWorks uses enterprise-grade encryption, row-level security, and secure file storage for all your receipts and documents. Your data is never shared with third parties, and all connections are encrypted end-to-end.",
  },
  {
    q: "Do I need to be tech-savvy to use it?",
    a: "Not at all. GroundWorks is designed to be intuitive from day one — most users are up and running in under 3 minutes. No training, no onboarding calls, no learning curve. If you can use a smartphone, you can use GroundWorks.",
  },
  {
    q: "Can I generate documents and reports?",
    a: "Yes. Generate branded PDFs for receipts, invoices, scope of work documents, and contractor directories. Export daily logs, budget breakdowns, and spending reports — all with your company logo and branding.",
  },
  {
    q: "What's included in the free trial?",
    a: "Everything. You get full access to all 12+ modules for 7 days with no credit card required. No feature gates, no limits — use it like you own it.",
  },
  {
    q: "What if I need help getting started?",
    a: "We've got you covered. Reach out via in-app support chat anytime and our team will help you get set up, import your data, or answer any questions. We're builders too — we get it.",
  },
];

export default function FAQ() {
  return (
    <section className="py-14 sm:py-20 bg-card border-y border-border/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 data-reveal className="scroll-slide-right font-heading text-3xl sm:text-4xl font-bold text-center mb-10">
          <span className="text-primary">FAQ</span>
        </h2>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                data-reveal
                className={`scroll-hidden stagger-${idx + 1} bg-card border border-border rounded-xl px-5 overflow-hidden`}
              >
                <AccordionTrigger className="text-left text-sm sm:text-base font-heading font-semibold py-5 min-h-[48px] hover:no-underline hover:bg-secondary/30 -mx-5 px-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

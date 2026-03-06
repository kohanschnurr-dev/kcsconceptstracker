import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What types of projects does GroundWorks support?",
    a: "GroundWorks is built for residential construction — fix & flips, rental rehabs, new builds, and remodels. If you're tracking budgets, subs, and timelines on construction projects, it's built for you.",
  },
  {
    q: "How does QuickBooks integration work?",
    a: "Connect your QuickBooks account and GroundWorks will sync your expenses automatically. You can categorize them, split costs across multiple projects, and batch-import with one click. It checks for duplicates so nothing gets counted twice.",
  },
  {
    q: "Can my project managers use the app too?",
    a: "Yes. Invite team members via email and assign roles with granular permissions — control who can view projects, manage expenses, handle procurement, and more. PMs can submit order requests that you approve from your dashboard.",
  },
  {
    q: "Is my data secure?",
    a: "GroundWorks uses Supabase for data storage with row-level security, encrypted connections, and secure file storage for receipts and documents. Your data is never shared with third parties.",
  },
  {
    q: "Can I generate documents and reports?",
    a: "Absolutely. Generate branded PDFs for receipts, invoices, scope of work documents, and contractor directories. Export daily logs, budget breakdowns, and spending reports — all with your company logo and branding.",
  },
  {
    q: "What's included in the free trial?",
    a: "Everything. You get full access to all 12+ modules for 14 days with no credit card required. No feature gates, no limits — use it like you own it.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 data-reveal className="scroll-slide-right font-heading text-3xl sm:text-4xl font-bold text-center mb-14">
          <span className="text-primary">FAQ</span>
        </h2>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                data-reveal
                className={`scroll-hidden stagger-${idx + 1} bg-card border border-border rounded-xl overflow-hidden`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors"
                >
                  <span className="font-heading font-semibold text-sm sm:text-base pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

const soloFeatures = [
  "Unlimited projects",
  "Budget tracking & cost breakdowns",
  "Draw request management",
  "Sub/vendor management",
  "Timeline & milestone tracking",
  "Photo documentation",
  "Material & order tracking",
  "Daily logs",
  "Document storage (5 GB)",
  "Basic reporting",
  "Mobile access",
  "Email support",
  "CSV export",
  "Single user",
];

const teamsExtra = [
  "Up to 5 team members",
  "Role-based permissions",
  "Shared project dashboards",
  "Advanced reporting & analytics",
  "Priority support",
  "25 GB document storage",
  "API access (coming soon)",
];

const faqs = [
  {
    q: "Is there really a free trial?",
    a: "Yes, 14 days, no credit card required. You get full access to all features in your chosen plan.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, upgrade or downgrade anytime. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "What happens after the trial?",
    a: "You choose a plan or your account pauses. No surprise charges.",
  },
  {
    q: "Can I add more team members?",
    a: "Contact us for custom team pricing beyond 5 seats.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards via Stripe.",
  },
  {
    q: "Is my data secure?",
    a: "Yes, 256-bit SSL encryption, daily backups, SOC 2 compliance in progress.",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleTrialClick = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-center mb-4">
            Simple, <span className="text-primary">Honest</span> Pricing
          </h1>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            No hidden fees. Start free, upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div className="flex flex-col items-center mb-10 h-14 justify-start">
            <div className="flex items-center gap-4">
              <span
                className={`text-sm ${!annual ? "text-foreground font-semibold" : "text-muted-foreground"}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  annual ? "bg-primary" : "bg-secondary"
                }`}
                aria-label="Toggle annual billing"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    annual ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-sm ${annual ? "text-foreground font-semibold" : "text-muted-foreground"}`}
              >
                Annual
              </span>
            </div>
            <span className={`mt-3 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full transition-opacity ${annual ? "opacity-100" : "opacity-0"}`}>
              Save ~13% with annual billing
            </span>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
            {/* Solo */}
            <div className="relative bg-card border-2 border-primary rounded-xl p-8">
              <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </span>
              <h3 className="font-heading text-2xl font-bold mb-2">Solo</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Everything one contractor needs.
              </p>
              <div className="mb-6">
                <span className="font-heading text-4xl font-extrabold">
                  ${annual ? "77" : "89"}
                </span>
                <span className="text-muted-foreground">/mo</span>
                {annual && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed $924/yr
                  </p>
                )}
              </div>
              <Button
                className="w-full min-h-[48px] gold-glow mb-6"
                onClick={handleTrialClick}
              >
                Start 14-Day Free Trial
              </Button>
              <p className="text-xs text-muted-foreground mb-4">
                No credit card required
              </p>
              <ul className="space-y-3">
                {soloFeatures.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Teams */}
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="font-heading text-2xl font-bold mb-2">Teams</h3>
              <p className="text-muted-foreground text-sm mb-6">
                For crews that collaborate.
              </p>
              <div className="mb-6">
                <span className="font-heading text-4xl font-extrabold">
                  ${annual ? "119" : "139"}
                </span>
                <span className="text-muted-foreground">/mo</span>
                {annual && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed $1,428/yr
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full min-h-[48px] mb-6"
                onClick={handleTrialClick}
              >
                Start 14-Day Free Trial
              </Button>
              <p className="text-xs text-muted-foreground mb-4">
                Everything in Solo, plus:
              </p>
              <ul className="space-y-3">
                {teamsExtra.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left text-sm font-medium py-4 min-h-[48px]">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

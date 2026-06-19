import { CheckCircle, Sparkles } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import DemoScheduler from "@/components/demo/DemoScheduler";

const covers = [
  "Set up your first project's budget — live",
  "Track expenses & lender-ready draw requests",
  "Manage subs, vendors, and daily logs",
  "Walk through project dashboards, timelines, and reports",
];

export default function Demo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      <section className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5 text-primary text-xs uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Live walkthrough · 30 min
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
              Book a <span className="text-primary">live walkthrough</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              I'll share my screen and set up your first project with you — start to finish.
              No slide deck, no sales pitch, just the product.
            </p>
          </div>

          <DemoScheduler />

          <div className="mt-12">
            <h2 className="font-heading text-lg font-bold text-center mb-5">
              What we'll cover
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {covers.map((c) => (
                <div key={c} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <p className="text-sm">{c}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-6">
              Bring one active project if you can — we'll build the budget together.
            </p>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

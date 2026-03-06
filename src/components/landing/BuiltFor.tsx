import {
  Home,
  TrendingUp,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";

const personas = [
  {
    icon: TrendingUp,
    color: "text-amber-400",
    label: "Fix & Flip",
    description: "Track every dollar from demo to sale so you know your true ROI before you list.",
  },
  {
    icon: Home,
    color: "text-sky-400",
    label: "Rental Properties",
    description: "Know your exact cost basis before you refi — no more guessing at rehab spend.",
  },
  {
    icon: RefreshCw,
    color: "text-violet-400",
    label: "BRRRR Strategy",
    description: "Generate draw schedules your lender can actually use, straight from your budget.",
  },
  {
    icon: MoreHorizontal,
    color: "text-rose-400",
    label: "And More",
    description: "Wholesalers, developers, property managers — if you touch rehab, we've got you.",
  },
];

export default function BuiltFor() {
  return (
    <section id="built-for" className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 data-reveal className="scroll-slide-right font-heading text-3xl sm:text-4xl font-bold text-center mb-3">
          One Platform for <span className="text-primary">Every Deal</span>
        </h2>
        <p data-reveal className="scroll-slide-right text-muted-foreground text-center max-w-2xl mx-auto mb-14">
          Everything you need to manage rehabs, rentals, and flips — in one place.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {personas.map((p, i) => (
            <div
              key={p.label}
              data-reveal
              className={`scroll-hidden stagger-${i + 1} bg-card border border-border rounded-xl p-5 sm:p-6 text-center hover:border-primary/30 hover-gold-glow transition-all`}
            >
              <p.icon className={`w-8 h-8 mx-auto mb-3 ${p.color}`} />
              <h3 className="font-heading font-semibold text-sm sm:text-base mb-1">
                {p.label}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import {
  HardHat,
  TrendingUp,
  Home,
  Building2,
  ClipboardCheck,
} from "lucide-react";

const personas = [
  {
    icon: HardHat,
    color: "text-amber-400",
    label: "General Contractors",
    description: "Run every job from one dashboard.",
  },
  {
    icon: TrendingUp,
    color: "text-violet-400",
    label: "Fix & Flip Investors",
    description: "Track rehab budgets and draw requests.",
  },
  {
    icon: Home,
    color: "text-sky-400",
    label: "Rental Property Owners",
    description: "Manage renovations across your portfolio.",
  },
  {
    icon: Building2,
    color: "text-emerald-400",
    label: "Real Estate Developers",
    description: "Oversee timelines, budgets, and subs at scale.",
  },
  {
    icon: ClipboardCheck,
    color: "text-rose-400",
    label: "Construction Managers",
    description: "Keep every project on track and documented.",
  },
];

export default function BuiltFor() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-14">
          Built For <span className="text-primary">Builders</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {personas.map((p) => (
            <div
              key={p.label}
              className="bg-card border border-border rounded-xl p-5 sm:p-6 text-center hover:border-primary/30 transition-colors"
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

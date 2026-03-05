import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "GroundWorks replaced three apps and a spreadsheet nightmare. I know exactly where every dollar goes on every project.",
    name: "Marcus T.",
    role: "General Contractor, Dallas TX",
    initials: "MT",
    color: "bg-amber-500/20 text-amber-400",
  },
  {
    quote:
      "The draw tracking alone saved me 10 hours a month. My lender loves the automated reports.",
    name: "Sarah K.",
    role: "Fix & Flip Investor, Fort Worth TX",
    initials: "SK",
    color: "bg-violet-500/20 text-violet-400",
  },
  {
    quote:
      "I manage 14 rental rehabs at once. GroundWorks keeps my subs, budgets, and timelines in one place.",
    name: "Jason R.",
    role: "Property Manager, DFW",
    initials: "JR",
    color: "bg-emerald-500/20 text-emerald-400",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-14">
          Trusted by <span className="text-primary">Real Builders</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-card border border-border rounded-xl p-6 sm:p-8"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-primary text-primary"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground leading-relaxed mb-6">
                "{t.quote}"
              </blockquote>

              {/* Avatar + Info */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

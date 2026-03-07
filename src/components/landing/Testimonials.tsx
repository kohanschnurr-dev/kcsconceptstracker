import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I killed three tools the week I started. Budget, schedule, receipts — it's all in one place now and I actually trust the numbers.",
    name: "Marcus T.",
    role: "Real Estate Investor, Dallas TX",
    initials: "MT",
    color: "bg-amber-500/20 text-amber-400",
  },
  {
    quote:
      "I was tracking everything in spreadsheets and losing receipts left and right. Now every expense is logged with a photo and tied to the right project automatically.",
    name: "Sarah K.",
    role: "Fix & Flip Investor, Fort Worth TX",
    initials: "SK",
    color: "bg-violet-500/20 text-violet-400",
  },
  {
    quote:
      "I'm running 14 rehabs right now. GroundWorks keeps every budget, receipt, and task organized across all of them — I can't manage at this scale without it.",
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
        <h2 data-reveal className="scroll-slide-left font-heading text-3xl sm:text-4xl font-bold text-center mb-14">
          Don't Take Our <span className="text-primary">Word For It</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              data-reveal
              className={`scroll-hidden stagger-${i + 1} bg-card border border-border rounded-xl p-6 sm:p-8 hover-gold-glow transition-all`}
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

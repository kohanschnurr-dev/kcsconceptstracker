import { UserPlus, FolderOpen, TrendingUp } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Sign Up & Create a Project",
    desc: "Create your account in 30 seconds. Add your first project with address, budget, and timeline. Invite your crew.",
  },
  {
    step: "02",
    icon: FolderOpen,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Track Everything in One Place",
    desc: "Log expenses, upload receipts, manage procurement, schedule milestones, and keep daily logs — all from one dashboard.",
  },
  {
    step: "03",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Stay Profitable & In Control",
    desc: "Real-time budget alerts, profit calculators, and one-click reports keep you profitable on every project.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-28 bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <h2 className="font-heading text-[22px] sm:text-4xl font-bold text-center mb-4">
          Up and Running in <span className="text-primary">Minutes</span>
        </h2>
        <p className="text-muted-foreground text-center mb-10 sm:mb-14 max-w-xl mx-auto leading-relaxed">
          No onboarding calls. No consultants. Just sign up and start managing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="relative">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
                )}

                <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center relative">
                  <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-7 h-7 ${s.color}`} />
                  </div>
                  <span className="text-xs font-mono text-primary font-semibold tracking-wider">
                    STEP {s.step}
                  </span>
                  <h3 className="font-heading text-lg font-bold mt-2 mb-3">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

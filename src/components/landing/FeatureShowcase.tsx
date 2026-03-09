import {
  DollarSign,
  Users,
  ShoppingCart,
  Calculator,
  BarChart3,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface ShowcaseItem {
  icon: LucideIcon;
  color: string;
  bg: string;
  title: string;
  headline: string;
  bullets: string[];
}

const showcaseItems: ShowcaseItem[] = [
  {
    icon: DollarSign,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Budget & Expense Engine",
    headline: "Know where every dollar goes — before it's gone.",
    bullets: [
      "Set line-item budgets by category (demo, framing, electrical, finishes, etc.)",
      "Real-time variance tracking: over budget, under budget, on track",
      "Import expenses from CSV with AI-powered category matching",
      "Split expenses across multiple projects with one click",
      "QuickBooks sync pulls transactions automatically",
    ],
  },
  {
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Team Collaboration",
    headline: "Your crew. Your rules. Zero confusion.",
    bullets: [
      "Invite project managers with secure token-based invitations",
      "9 granular permissions: view projects, manage budgets, manage procurement, and more",
      "Real-time PM-to-owner messaging with unread badges",
      "Company branding synced across your entire team",
      "Activity notifications for orders, expenses, tasks, and messages",
    ],
  },
  {
    icon: ShoppingCart,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Procurement & Orders",
    headline: "From material list to delivery — tracked end to end.",
    bullets: [
      "PMs submit order requests with line items, quantities, and source URLs",
      "Owner approves or rejects individual line items",
      "Track order status from submitted to delivered",
      "Automatic price snapshots so you always know what you approved",
      "Receipt photo uploads tied directly to each expense",
    ],
  },
  {
    icon: Calculator,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    title: "Financial Modeling",
    headline: "Run the numbers before you run the job.",
    bullets: [
      "Profit calculator: net profit, ROI, and cash-on-cash return",
      "Rental cash flow: monthly income vs. mortgage, taxes, insurance, maintenance",
      "Hard money loan calculator with interest accrual and points",
      "Budget templates with per-sqft and flat-rate presets",
      "Export financials to PDF for lenders and partners",
    ],
  },
  {
    icon: BarChart3,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Reporting & Documents",
    headline: "Professional reports. One click. Every time.",
    bullets: [
      "Dashboard with spending trends, category donuts, and budget breakdowns",
      "Generate branded receipts, invoices, and scope of work PDFs",
      "Contractor directory export with ratings, trades, and W9 status",
      "Daily logs with timestamped photos and exportable records",
      "Vendor compliance tracking across your entire portfolio",
    ],
  },
];

export default function FeatureShowcase() {
  return (
    <section className="py-16 sm:py-28">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8">
        <h2 className="font-heading text-[22px] sm:text-4xl font-bold text-center mb-4">
          Deep Tools, Not <span className="text-primary">Shallow Features</span>
        </h2>
        <p className="text-muted-foreground text-center mb-10 sm:mb-16 max-w-2xl mx-auto leading-relaxed">
          Every module is built with the depth contractors actually need — not watered-down
          demos that fall apart on real jobs.
        </p>

        <div className="space-y-6 sm:space-y-8">
          {showcaseItems.map((item, idx) => {
            const Icon = item.icon;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={item.title}
                className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-4 sm:gap-8 items-center`}
              >
                {/* Text side */}
                <div className="flex-1 w-full">
                  <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {item.title}
                      </span>
                    </div>
                    <h3 className="font-heading text-xl sm:text-2xl font-bold mb-5">
                      {item.headline}
                    </h3>
                    <ul className="space-y-3">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Visual side — styled data preview card */}
                <div className="flex-1 w-full">
                  <FeatureVisual item={item} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureVisual({ item }: { item: ShowcaseItem }) {
  const Icon = item.icon;

  return (
    <div className="bg-card border border-border rounded-xl p-6 sm:p-8 h-full flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(38_92%_50%_/_0.04)_0%,_transparent_70%)]" />

      <div className="relative z-10 text-center">
        <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${item.color}`} />
        </div>
        <p className="font-heading text-lg font-semibold mb-2">{item.title}</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {item.headline}
        </p>
      </div>

      {/* Corner accent */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5" />
      <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-primary/3" />
    </div>
  );
}

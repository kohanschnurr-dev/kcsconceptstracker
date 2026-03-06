import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  BarChart3,
  Users,
  ShoppingCart,
  Calculator,
  FileText,
  Calendar,
  ClipboardList,
  MessageSquare,
  Bell,
  Upload,
  Sparkles,
  CheckCircle2,
  Play,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Module {
  icon: LucideIcon;
  color: string;
  bg: string;
  title: string;
  desc: string;
  headline?: string;
  bullets?: string[];
}

const modules: Module[] = [
  {
    icon: DollarSign,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Budget & Expense Tracking",
    desc: "Category-level budgets with real-time variance alerts and spending breakdowns.",
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
    icon: BarChart3,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Dashboard Analytics",
    desc: "Spending trends, donut charts, and drill-down stats across every project.",
    headline: "See the big picture at a glance.",
    bullets: [
      "Real-time project health indicators and spending breakdowns",
      "Spending trend charts that update as expenses are logged",
      "Category donut charts for visual budget allocation",
      "Drill-down stats from dashboard to individual transactions",
    ],
  },
  {
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Team & Permissions",
    desc: "Invite PMs, set role-based permissions, and collaborate in real time.",
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
    title: "Procurement Orders",
    desc: "Submit, approve, and track material orders with line-item detail.",
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
    title: "Financial Calculators",
    desc: "Profit/ROI, rental cash flow, and hard money loan modeling built in.",
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
    icon: FileText,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Document Generation",
    desc: "One-click PDFs for receipts, invoices, scope of work, and contractor reports.",
    headline: "Professional reports. One click. Every time.",
    bullets: [
      "Generate branded receipts, invoices, and scope of work PDFs",
      "Contractor directory export with ratings, trades, and W9 status",
      "Daily logs with timestamped photos and exportable records",
      "Vendor compliance tracking across your entire portfolio",
    ],
  },
  {
    icon: Calendar,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Calendar & Milestones",
    desc: "Schedule events, track deadlines, and manage recurring tasks.",
    headline: "Never miss a deadline again.",
    bullets: [
      "Build project timelines with start/end dates and milestone markers",
      "Gantt-style views that update as tasks are completed",
      "Get notified when tasks slip or milestones are at risk",
      "Compare planned vs. actual timelines to improve estimates",
    ],
  },
  {
    icon: ClipboardList,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Daily Logs",
    desc: "Document site activity with timestamped photos, notes, and crew details.",
    headline: "Your project diary, digitized.",
    bullets: [
      "Log daily activities including work completed, hours, and crew present",
      "Record weather conditions, delays, and site issues",
      "Attach photos and notes to each daily entry",
      "Export daily logs for lender reporting or legal records",
    ],
  },
  {
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Real-Time Messaging",
    desc: "Direct PM-to-owner threads with unread counts and instant delivery.",
    headline: "Stay connected with your team instantly.",
    bullets: [
      "Direct PM-to-owner messaging threads",
      "Unread badges and instant delivery notifications",
      "Message history tied to project context",
      "No more lost texts or buried emails",
    ],
  },
  {
    icon: Bell,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Smart Notifications",
    desc: "Customizable alerts for orders, expenses, tasks, messages, and more.",
    headline: "Know what matters, when it matters.",
    bullets: [
      "Customizable alerts by event type",
      "Order approvals, expense updates, task assignments",
      "Message notifications with unread counts",
      "Never miss a critical update across your portfolio",
    ],
  },
  {
    icon: Upload,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    title: "QuickBooks Sync",
    desc: "Pull expenses, auto-categorize, split across projects, and batch import.",
    headline: "Your books, always in sync.",
    bullets: [
      "Pull expenses directly from QuickBooks",
      "Auto-categorize transactions with AI matching",
      "Split expenses across multiple projects",
      "Batch import with one-click approval",
    ],
  },
];

export default function PlatformOverview() {
  const [selected, setSelected] = useState<Module | null>(null);

  return (
    <section id="features" className="py-20 sm:py-28 bg-secondary/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center mb-4">
          One Platform. <span className="text-primary">Every Module You Need.</span>
        </h2>
        <p className="text-muted-foreground text-center mb-14 max-w-2xl mx-auto">
          GroundWorks isn't a stripped-down tracker — it's a full operating system
          for construction projects with 12+ integrated modules.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                onClick={() => setSelected(m)}
                className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${m.color}`} />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm mb-1">
                      {m.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {m.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            to="/features"
            className="group bg-card border border-border rounded-xl p-5 flex items-start gap-3 hover:border-primary/30 transition-all"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm mb-1">And More...</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore all features built for investors.
              </p>
            </div>
          </Link>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected && (() => {
            const Icon = selected.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-10 h-10 rounded-lg ${selected.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${selected.color}`} />
                    </div>
                    <DialogTitle className="text-xl font-heading">{selected.title}</DialogTitle>
                  </div>
                  {selected.headline && (
                    <DialogDescription className="text-base text-foreground/80 font-medium pt-1">
                      {selected.headline}
                    </DialogDescription>
                  )}
                </DialogHeader>

                {/* Video placeholder */}
                <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center border border-border">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Play className="w-6 h-6 text-primary ml-0.5" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Demo Video Coming Soon</p>
                </div>

                {/* Bullet points */}
                {selected.bullets && selected.bullets.length > 0 && (
                  <ul className="space-y-3 pt-2">
                    {selected.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </section>
  );
}

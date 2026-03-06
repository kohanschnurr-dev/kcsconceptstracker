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
} from "lucide-react";

const modules = [
  {
    icon: DollarSign,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Budget & Expense Tracking",
    desc: "Category-level budgets with real-time variance alerts and spending breakdowns.",
  },
  {
    icon: BarChart3,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Dashboard Analytics",
    desc: "Spending trends, donut charts, and drill-down stats across every project.",
  },
  {
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Team & Permissions",
    desc: "Invite PMs, set role-based permissions, and collaborate in real time.",
  },
  {
    icon: ShoppingCart,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Procurement Orders",
    desc: "Submit, approve, and track material orders with line-item detail.",
  },
  {
    icon: Calculator,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    title: "Financial Calculators",
    desc: "Profit/ROI, rental cash flow, and hard money loan modeling built in.",
  },
  {
    icon: FileText,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    title: "Document Generation",
    desc: "One-click PDFs for receipts, invoices, scope of work, and contractor reports.",
  },
  {
    icon: Calendar,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Calendar & Milestones",
    desc: "Schedule events, track deadlines, and manage recurring tasks.",
  },
  {
    icon: ClipboardList,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    title: "Daily Logs",
    desc: "Document site activity with timestamped photos, notes, and crew details.",
  },
  {
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "Real-Time Messaging",
    desc: "Direct PM-to-owner threads with unread counts and instant delivery.",
  },
  {
    icon: Bell,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    title: "Smart Notifications",
    desc: "Customizable alerts for orders, expenses, tasks, messages, and more.",
  },
  {
    icon: Upload,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    title: "QuickBooks Sync",
    desc: "Pull expenses, auto-categorize, split across projects, and batch import.",
  },
];

export default function PlatformOverview() {
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
                className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
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
    </section>
  );
}
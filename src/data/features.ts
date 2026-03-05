import {
  DollarSign,
  Clock,
  Users,
  FileText,
  Camera,
  Package,
  ClipboardList,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  title: string;
  slug: string;
  icon: LucideIcon;
  color: string;
  description: string;
  details: string[];
}

export const features: Feature[] = [
  {
    title: "Budget Tracking",
    slug: "budget-tracking",
    icon: DollarSign,
    color: "text-amber-400",
    description:
      "Track every dollar across every project. Set budgets by category, monitor spend in real time, and catch overruns before they eat your margin.",
    details: [
      "Create detailed budgets with line-item categories like demo, framing, electrical, plumbing, HVAC, and finishes.",
      "Compare budgeted vs. actual spend in real time — no more end-of-project surprises.",
      "Set alerts for categories approaching their limit so you can course-correct early.",
      "Roll unused budget forward or reallocate across categories with a few clicks.",
    ],
  },
  {
    title: "Draw Management",
    slug: "draw-management",
    icon: FileText,
    color: "text-sky-400",
    description:
      "Generate draw requests backed by real data. Attach photos, receipts, and progress notes — your lender gets everything they need in one package.",
    details: [
      "Auto-generate draw requests from your budget and expense data — no manual spreadsheets.",
      "Attach inspection photos, receipts, and lien waivers directly to each draw.",
      "Track draw approval status and funding timelines in one view.",
      "Export lender-ready PDF reports with a single click.",
    ],
  },
  {
    title: "Timeline & Milestones",
    slug: "timeline-milestones",
    icon: Clock,
    color: "text-violet-400",
    description:
      "Map out your project timeline with milestones and task dependencies. See what's on track, what's behind, and what's blocking progress.",
    details: [
      "Build project timelines with start/end dates, dependencies, and milestone markers.",
      "Visualize progress with Gantt-style views that update as tasks are completed.",
      "Get notified when tasks slip or milestones are at risk.",
      "Compare planned vs. actual timelines to improve future project estimates.",
    ],
  },
  {
    title: "Sub & Vendor Management",
    slug: "sub-vendor-management",
    icon: Users,
    color: "text-emerald-400",
    description:
      "Keep your subs organized. Track bids, contracts, payments, and performance — all in one place instead of scattered texts and emails.",
    details: [
      "Maintain a vendor directory with contact info, trade specialties, and project history.",
      "Track bids, compare pricing, and assign subs to specific project scopes.",
      "Log payments and outstanding balances per vendor per project.",
      "Rate vendor performance to build your go-to crew over time.",
    ],
  },
  {
    title: "Photo Documentation",
    slug: "photo-documentation",
    icon: Camera,
    color: "text-rose-400",
    description:
      "Document progress with timestamped photos organized by project and phase. Never scramble for before/after shots again.",
    details: [
      "Upload photos directly from your phone — they're automatically tagged with date, project, and phase.",
      "Organize galleries by room, trade, or milestone for easy reference.",
      "Attach photos to draw requests, daily logs, or inspection reports.",
      "Compare before/after shots side-by-side to showcase project progress.",
    ],
  },
  {
    title: "Material & Order Tracking",
    slug: "material-order-tracking",
    icon: Package,
    color: "text-amber-400",
    description:
      "Track material orders, delivery dates, and costs. Know what's been ordered, what's on-site, and what's still pending.",
    details: [
      "Create purchase orders tied to specific budget categories and projects.",
      "Track order status from placed to delivered with real-time updates.",
      "Flag delayed materials that could impact your project timeline.",
      "Compare vendor pricing across orders to negotiate better deals.",
    ],
  },
  {
    title: "Daily Logs",
    slug: "daily-logs",
    icon: ClipboardList,
    color: "text-sky-400",
    description:
      "Keep a daily record of work completed, weather conditions, crew on-site, and issues encountered. Your project diary, digitized.",
    details: [
      "Log daily activities including work completed, hours worked, and crew present.",
      "Record weather conditions, delays, and site issues for dispute protection.",
      "Attach photos and notes to each daily entry for complete documentation.",
      "Export daily logs for lender reporting, insurance claims, or legal records.",
    ],
  },
  {
    title: "Reporting & Analytics",
    slug: "reporting-analytics",
    icon: BarChart3,
    color: "text-violet-400",
    description:
      "See the big picture. Dashboards and reports that show project health, spending trends, and profitability at a glance.",
    details: [
      "Dashboard views with real-time project health indicators and spending breakdowns.",
      "Generate profit/loss reports per project or across your entire portfolio.",
      "Track spending trends over time to identify patterns and optimize budgets.",
      "Export reports to PDF or CSV for partners, lenders, and tax prep.",
    ],
  },
];

import { useMemo } from "react";
import {
  Users,
  Clock,
  CreditCard,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AdminUser, DemoRequest } from "@/types/admin";

interface Props {
  users: AdminUser[];
  demoRequests: DemoRequest[];
  isLoading: boolean;
}

export default function AdminOverview({ users, demoRequests, isLoading }: Props) {
  const kpis = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const totalUsers = users.length;
    const activeTrials = users.filter((u) => u.status === "trial").length;
    const activePaid = users.filter((u) => u.status === "active").length;
    const pendingDemos = demoRequests.filter((d) => d.status === "new").length;
    const signupsThisWeek = users.filter(
      (u) => new Date(u.created_at) >= weekAgo
    ).length;

    return { totalUsers, activeTrials, activePaid, pendingDemos, signupsThisWeek };
  }, [users, demoRequests]);

  const chartData = useMemo(() => {
    const now = new Date();
    const days: { date: string; signups: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = users.filter(
        (u) => u.created_at.slice(0, 10) === dateStr
      ).length;
      days.push({ date: dateStr.slice(5), signups: count });
    }
    return days;
  }, [users]);

  const recentActivity = useMemo(() => {
    const activities: { id: string; text: string; time: string; type: string }[] = [];

    users.slice(0, 20).forEach((u) => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "User";
      activities.push({
        id: `signup-${u.id}`,
        text: `${name} signed up`,
        time: u.created_at,
        type: "signup",
      });
      if (u.status === "trial") {
        activities.push({
          id: `trial-${u.id}`,
          text: `${name} started free trial`,
          time: u.created_at,
          type: "trial",
        });
      }
      if (u.status === "active") {
        activities.push({
          id: `paid-${u.id}`,
          text: `${name} converted to paid`,
          time: u.created_at,
          type: "conversion",
        });
      }
    });

    demoRequests.slice(0, 10).forEach((d) => {
      activities.push({
        id: `demo-${d.id}`,
        text: `${d.name} requested a demo`,
        time: d.created_at,
        type: "demo",
      });
    });

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);
  }, [users, demoRequests]);

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const kpiCards = [
    { label: "Total Users", value: kpis.totalUsers, icon: Users, color: "text-amber-400" },
    { label: "Active Trials", value: kpis.activeTrials, icon: Clock, color: "text-sky-400" },
    { label: "Active Paid", value: kpis.activePaid, icon: CreditCard, color: "text-emerald-400" },
    { label: "Pending Demos", value: kpis.pendingDemos, icon: MessageSquare, color: "text-violet-400" },
    { label: "Signups This Week", value: kpis.signupsThisWeek, icon: UserPlus, color: "text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="font-heading text-2xl font-bold">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Signups Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold mb-4">Signups — Last 30 Days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(210 20% 60%)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(210 20% 60%)" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220 18% 13%)",
                  border: "1px solid hsl(220 15% 20%)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="signups"
                stroke="hsl(32 95% 55%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      a.type === "signup"
                        ? "bg-amber-400"
                        : a.type === "trial"
                        ? "bg-sky-400"
                        : a.type === "conversion"
                        ? "bg-emerald-400"
                        : "bg-violet-400"
                    }`}
                  />
                  <span>{a.text}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(a.time).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

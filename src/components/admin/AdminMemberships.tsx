import { useState, useMemo } from "react";
import { Search, ArrowUpDown, Clock, CheckCircle2, XCircle, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/types/admin";
import { toast } from "sonner";

interface Props {
  users: AdminUser[];
  isLoading: boolean;
  trialLengthDays: number;
  onUpdateUser: (userId: string, updates: { subscription_tier?: string }) => void;
  onExtendTrial: (userId: string, days: number) => void;
}

export default function AdminMemberships({
  users,
  isLoading,
  trialLengthDays,
  onUpdateUser,
  onExtendTrial,
}: Props) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "trials">("all");
  const [sortKey, setSortKey] = useState<"name" | "tier" | "created_at">("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const memberships = useMemo(() => {
    let list = [...users];
    if (view === "trials") list = list.filter((u) => u.status === "trial");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          (u.first_name ?? "").toLowerCase().includes(q) ||
          (u.last_name ?? "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")
        cmp = ((a.first_name ?? "") + (a.last_name ?? "")).localeCompare(
          (b.first_name ?? "") + (b.last_name ?? "")
        );
      else if (sortKey === "tier") cmp = a.subscription_tier.localeCompare(b.subscription_tier);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [users, search, view, sortKey, sortAsc]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const trialDaysRemaining = (u: AdminUser) => {
    if (!u.trial_end) return 0;
    const diff = new Date(u.trial_end).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  const trialUsers = users.filter((u) => u.status === "trial");
  const paidUsers = users.filter((u) => u.status === "active");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Memberships & Trials</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-muted-foreground">Active Trials</span>
          </div>
          <p className="font-heading text-2xl font-bold">{trialUsers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{trialLengthDays}-day trial period</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Paid Members</span>
          </div>
          <p className="font-heading text-2xl font-bold">{paidUsers.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-muted-foreground">Churned</span>
          </div>
          <p className="font-heading text-2xl font-bold">
            {users.filter((u) => u.status === "churned").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
        </div>
        <div className="flex gap-1">
          <Button variant={view === "all" ? "default" : "outline"} size="sm" onClick={() => setView("all")}>
            All
          </Button>
          <Button variant={view === "trials" ? "default" : "outline"} size="sm" onClick={() => setView("trials")}>
            Trials Only
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort("name")}>
                  <span className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort("tier")}>
                  <span className="flex items-center gap-1">Plan <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort("created_at")}>
                  <span className="flex items-center gap-1">Start Date <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 font-semibold">Trial Days Left</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{u.subscription_tier}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.status === "trial"
                          ? "bg-sky-400/10 text-sky-400"
                          : u.status === "active"
                          ? "bg-emerald-400/10 text-emerald-400"
                          : u.status === "churned"
                          ? "bg-rose-400/10 text-rose-400"
                          : "bg-gray-400/10 text-gray-400"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {u.status === "trial" ? (
                      <span className={trialDaysRemaining(u) <= 3 ? "text-rose-400 font-semibold" : ""}>
                        {trialDaysRemaining(u)} days
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.status === "trial" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-400 text-xs"
                            onClick={() => onUpdateUser(u.id, { subscription_tier: "pro" })}
                          >
                            Convert
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sky-400 text-xs"
                            onClick={() => onExtendTrial(u.id, 7)}
                          >
                            +7 days
                          </Button>
                        </>
                      )}
                      {u.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-400 text-xs"
                          onClick={() => onUpdateUser(u.id, { subscription_tier: "churned" })}
                        >
                          Cancel
                        </Button>
                      )}
                      {(u.status === "churned" || u.status === "inactive") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-400 text-xs"
                          onClick={() => onUpdateUser(u.id, { subscription_tier: "pro" })}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {memberships.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No memberships found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

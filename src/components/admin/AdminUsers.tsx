import { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, X, ArrowUpDown, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { AdminUser } from "@/types/admin";

interface OnboardingData {
  user_role: string | null;
  annual_project_volume: string | null;
  pain_points: string[] | null;
  current_tools: string | null;
  team_size: string | null;
  created_at: string;
}

interface Props {
  users: AdminUser[];
  isLoading: boolean;
  onUpdateUser: (userId: string, updates: { subscription_tier?: string }) => void;
  onExtendTrial: (userId: string, days: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-sky-400/10 text-sky-400",
  active: "bg-emerald-400/10 text-emerald-400",
  churned: "bg-rose-400/10 text-rose-400",
  inactive: "bg-gray-400/10 text-gray-400",
};

type SortKey = "name" | "created_at" | "status" | "subscription_tier";

export default function AdminUsers({ users, isLoading, onUpdateUser, onExtendTrial }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [extendDays, setExtendDays] = useState("7");
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (!selectedUser) {
      setOnboarding(null);
      return;
    }
    setOnboardingLoading(true);
    (supabase.from as any)("user_onboarding")
      .select("user_role, annual_project_volume, pain_points, current_tools, team_size, created_at")
      .eq("user_id", selectedUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }: { data: any[] | null }) => {
        setOnboarding(data?.[0] ?? null);
        setOnboardingLoading(false);
      });
  }, [selectedUser]);

  const filtered = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          (u.first_name ?? "").toLowerCase().includes(q) ||
          (u.last_name ?? "").toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((u) => u.status === statusFilter);
    if (tierFilter !== "all") list = list.filter((u) => u.subscription_tier === tierFilter);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = ((a.first_name ?? "") + (a.last_name ?? "")).localeCompare(
            (b.first_name ?? "") + (b.last_name ?? "")
          );
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "subscription_tier":
          cmp = a.subscription_tier.localeCompare(b.subscription_tier);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [users, search, statusFilter, tierFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Users & Signups</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="churned">Churned</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {[
                  { key: "name" as SortKey, label: "Name" },
                  { key: "created_at" as SortKey, label: "Signup Date" },
                  { key: "status" as SortKey, label: "Status" },
                  { key: "subscription_tier" as SortKey, label: "Plan" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedUser(u)}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email || u.id.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.subscription_tier}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(u);
                      }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">User Detail</h3>
              <button onClick={() => setSelectedUser(null)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span>{[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(" ") || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs">{selectedUser.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signup Date</span>
                <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedUser.status]}`}>
                  {selectedUser.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="capitalize">{selectedUser.subscription_tier}</span>
              </div>
              {selectedUser.trial_end && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial Ends</span>
                  <span>{new Date(selectedUser.trial_end).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Onboarding Questionnaire */}
            {onboardingLoading ? (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">Loading onboarding data...</p>
              </div>
            ) : onboarding ? (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">Onboarding Questionnaire</h4>
                </div>
                <div className="space-y-2 text-sm bg-secondary/30 rounded-lg p-3">
                  {onboarding.user_role && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span>{onboarding.user_role}</span>
                    </div>
                  )}
                  {onboarding.annual_project_volume && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projects/Year</span>
                      <span>{onboarding.annual_project_volume}</span>
                    </div>
                  )}
                  {onboarding.pain_points && onboarding.pain_points.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-xs">Pain Points</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {onboarding.pain_points.map((p) => (
                          <span key={p} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {onboarding.current_tools && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Tools</span>
                      <span className="text-right max-w-[200px]">{onboarding.current_tools}</span>
                    </div>
                  )}
                  {onboarding.team_size && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Team Size</span>
                      <span>{onboarding.team_size}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground italic">No onboarding questionnaire data</p>
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateUser(selectedUser.id, { subscription_tier: "pro" });
                    setSelectedUser(null);
                  }}
                >
                  Activate Pro
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onUpdateUser(selectedUser.id, { subscription_tier: "premium" });
                    setSelectedUser(null);
                  }}
                >
                  Activate Premium
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-400"
                  onClick={() => {
                    onUpdateUser(selectedUser.id, { subscription_tier: "churned" });
                    setSelectedUser(null);
                  }}
                >
                  Deactivate
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-20"
                  min="1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    onExtendTrial(selectedUser.id, parseInt(extendDays) || 7);
                    setSelectedUser(null);
                  }}
                >
                  Extend Trial (days)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

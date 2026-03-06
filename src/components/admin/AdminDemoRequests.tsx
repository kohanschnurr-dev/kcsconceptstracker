import { useState, useMemo } from "react";
import { Search, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DemoRequest, DemoRequestStatus } from "@/types/admin";

interface Props {
  demoRequests: DemoRequest[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: DemoRequestStatus) => void;
  onUpdateNotes: (id: string, notes: string | null, follow_up_date: string | null) => void;
}

const STATUS_OPTS: { value: DemoRequestStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-amber-400/10 text-amber-400" },
  { value: "contacted", label: "Contacted", color: "bg-sky-400/10 text-sky-400" },
  { value: "scheduled", label: "Scheduled", color: "bg-violet-400/10 text-violet-400" },
  { value: "completed", label: "Completed", color: "bg-emerald-400/10 text-emerald-400" },
  { value: "no-show", label: "No-Show", color: "bg-rose-400/10 text-rose-400" },
];

export default function AdminDemoRequests({
  demoRequests,
  isLoading,
  onUpdateStatus,
  onUpdateNotes,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<DemoRequest | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "created_at" | "status">("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let list = [...demoRequests];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          (d.company ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [demoRequests, search, statusFilter, sortKey, sortAsc]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const openDetail = (d: DemoRequest) => {
    setSelected(d);
    setEditNotes(d.notes ?? "");
    setEditFollowUp(d.follow_up_date ?? "");
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Demo Requests</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_OPTS.map((s) => {
          const count = demoRequests.filter((d) => d.status === s.value).length;
          return (
            <div
              key={s.value}
              className="bg-card border border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setStatusFilter(statusFilter === s.value ? "all" : s.value)}
            >
              <p className="font-heading text-xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, company..." className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          {STATUS_OPTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort("created_at")}>
                  <span className="flex items-center gap-1">Submitted <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer" onClick={() => handleSort("status")}>
                  <span className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-4 py-3 font-semibold">Follow-Up</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const statusInfo = STATUS_OPTS.find((s) => s.value === d.status);
                return (
                  <tr
                    key={d.id}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                    onClick={() => openDetail(d)}
                  >
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.company || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color}`}>
                        {statusInfo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.follow_up_date ? new Date(d.follow_up_date).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No demo requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">Demo Request Detail</h3>
              <button onClick={() => setSelected(null)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{selected.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selected.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span>{selected.company || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selected.phone || "—"}</span></div>
              {selected.message && (
                <div>
                  <span className="text-muted-foreground">Message</span>
                  <p className="mt-1 bg-secondary/30 rounded p-2">{selected.message}</p>
                </div>
              )}
            </div>

            {/* Status Update */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTS.map((s) => (
                  <Button
                    key={s.value}
                    variant={selected.status === s.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onUpdateStatus(selected.id, s.value);
                      setSelected({ ...selected, status: s.value });
                    }}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Internal Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-lg p-2 text-sm min-h-[80px] resize-y"
              />
            </div>

            {/* Follow-up date */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Follow-Up Date</label>
              <Input
                type="date"
                value={editFollowUp}
                onChange={(e) => setEditFollowUp(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => {
                onUpdateNotes(selected.id, editNotes || null, editFollowUp || null);
                setSelected(null);
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

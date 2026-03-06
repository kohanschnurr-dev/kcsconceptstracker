import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminUser } from "@/types/admin";
import { toast } from "sonner";

function deriveStatus(profile: any): AdminUser["status"] {
  const tier = profile.subscription_tier ?? "free";
  if (tier === "free") {
    const createdAt = new Date(profile.created_at);
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);
    if (trialEnd > new Date()) return "trial";
    return "inactive";
  }
  if (tier === "churned") return "churned";
  return "active";
}

export function useAdminUsers() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((p: any) => {
        const status = deriveStatus(p);
        const createdAt = new Date(p.created_at);
        const trialEnd = new Date(createdAt);
        trialEnd.setDate(trialEnd.getDate() + 14);

        return {
          id: p.user_id,
          email: "", // will be enriched client-side if available
          created_at: p.created_at,
          first_name: p.first_name,
          last_name: p.last_name,
          subscription_tier: p.subscription_tier ?? "free",
          trial_start: p.created_at,
          trial_end: trialEnd.toISOString(),
          status,
        };
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: { subscription_tier?: string };
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  const extendTrial = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      // Extending trial = keep tier as free, the trial_end is derived from created_at + days
      // We'll store an override in admin_settings keyed by user id
      const { error } = await (supabase.from as any)("admin_settings")
        .upsert(
          { key: `trial_extension_${userId}`, value: String(days), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Trial extended");
    },
    onError: () => toast.error("Failed to extend trial"),
  });

  return { ...query, updateUser, extendTrial };
}

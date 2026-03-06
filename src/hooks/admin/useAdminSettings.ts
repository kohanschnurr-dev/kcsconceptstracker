import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminSetting } from "@/types/admin";
import { toast } from "sonner";

const DEFAULTS: Record<string, string> = {
  trial_length_days: "14",
  auto_trial: "true",
  notify_new_signup: "true",
  notify_demo_request: "true",
  notify_trial_expiring_days: "3",
};

export function useAdminSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "admin_settings"],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await (supabase.from as any)("admin_settings")
        .select("*");
      if (error) throw error;
      const map: Record<string, string> = { ...DEFAULTS };
      (data ?? []).forEach((row: AdminSetting) => {
        map[row.key] = row.value;
      });
      return map;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await (supabase.from as any)("admin_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "admin_settings"] });
      toast.success("Setting saved");
    },
    onError: () => toast.error("Failed to save setting"),
  });

  return { settings: query.data ?? DEFAULTS, isLoading: query.isLoading, updateSetting };
}

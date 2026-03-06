import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DemoRequest, DemoRequestStatus } from "@/types/admin";
import { toast } from "sonner";

export function useDemoRequests() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "demo_requests"],
    queryFn: async (): Promise<DemoRequest[]> => {
      const { data, error } = await (supabase.from as any)("demo_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DemoRequestStatus }) => {
      const { error } = await (supabase.from as any)("demo_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "demo_requests"] });
      toast.success("Demo request status updated");
    },
    onError: () => toast.error("Failed to update demo request"),
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, notes, follow_up_date }: { id: string; notes: string | null; follow_up_date: string | null }) => {
      const { error } = await (supabase.from as any)("demo_requests")
        .update({ notes, follow_up_date })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "demo_requests"] });
      toast.success("Demo request updated");
    },
    onError: () => toast.error("Failed to update demo request"),
  });

  return { ...query, updateStatus, updateNotes };
}

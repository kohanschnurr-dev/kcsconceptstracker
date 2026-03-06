import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminEvent, AdminEventType } from "@/types/admin";
import { toast } from "sonner";

export function useAdminEvents() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "admin_events"],
    queryFn: async (): Promise<AdminEvent[]> => {
      const { data, error } = await (supabase.from as any)("admin_events")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addEvent = useMutation({
    mutationFn: async (event: {
      title: string;
      event_type: AdminEventType;
      date: string;
      time?: string | null;
      notes?: string | null;
      related_user_id?: string | null;
    }) => {
      const { error } = await (supabase.from as any)("admin_events").insert(event);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "admin_events"] });
      toast.success("Event added");
    },
    onError: () => toast.error("Failed to add event"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)("admin_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "admin_events"] });
      toast.success("Event deleted");
    },
    onError: () => toast.error("Failed to delete event"),
  });

  return { ...query, addEvent, deleteEvent };
}

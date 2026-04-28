import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * When a calendar event moves, propagate the new start date to its linked task
 * (tasks.due_date and tasks.scheduled_date when scheduled).
 *
 * Silently no-ops if the event has no linked task.
 */
export async function syncLinkedTaskDate(eventId: string, newStartDate: Date) {
  try {
    const { data: event, error: evErr } = await supabase
      .from("calendar_events")
      .select("linked_task_id")
      .eq("id", eventId)
      .maybeSingle();

    if (evErr || !event?.linked_task_id) return;

    const dateStr = format(newStartDate, "yyyy-MM-dd");

    // Fetch task to know whether scheduled_date should also update
    const { data: task } = await supabase
      .from("tasks")
      .select("is_scheduled")
      .eq("id", event.linked_task_id)
      .maybeSingle();

    const updates: Record<string, string> = { due_date: dateStr };
    if (task?.is_scheduled) updates.scheduled_date = dateStr;

    await supabase.from("tasks").update(updates).eq("id", event.linked_task_id);
  } catch (e) {
    console.error("syncLinkedTaskDate failed", e);
  }
}

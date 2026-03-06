import { useState } from "react";
import { useAdminGuard } from "@/hooks/admin/useAdminGuard";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useDemoRequests } from "@/hooks/admin/useDemoRequests";
import { useAdminEvents } from "@/hooks/admin/useAdminEvents";
import { useAdminSettings } from "@/hooks/admin/useAdminSettings";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminMemberships from "@/components/admin/AdminMemberships";
import AdminDemoRequests from "@/components/admin/AdminDemoRequests";
import AdminCalendar from "@/components/admin/AdminCalendar";
import AdminSettings from "@/components/admin/AdminSettings";
import type { AdminSection } from "@/types/admin";

export default function Admin() {
  const { isAdmin, checking } = useAdminGuard();
  const [section, setSection] = useState<AdminSection>("overview");

  const {
    data: users = [],
    isLoading: usersLoading,
    updateUser,
    extendTrial,
  } = useAdminUsers();

  const {
    data: demoRequests = [],
    isLoading: demosLoading,
    updateStatus,
    updateNotes,
  } = useDemoRequests();

  const {
    data: events = [],
    isLoading: eventsLoading,
    addEvent,
    deleteEvent,
  } = useAdminEvents();

  const {
    settings,
    isLoading: settingsLoading,
    updateSetting,
  } = useAdminSettings();

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const trialLengthDays = parseInt(settings.trial_length_days ?? "14") || 14;

  return (
    <AdminLayout active={section} onNavigate={setSection}>
      {section === "overview" && (
        <AdminOverview
          users={users}
          demoRequests={demoRequests}
          isLoading={usersLoading || demosLoading}
        />
      )}
      {section === "users" && (
        <AdminUsers
          users={users}
          isLoading={usersLoading}
          onUpdateUser={(userId, updates) => updateUser.mutate({ userId, updates })}
          onExtendTrial={(userId, days) => extendTrial.mutate({ userId, days })}
        />
      )}
      {section === "memberships" && (
        <AdminMemberships
          users={users}
          isLoading={usersLoading}
          trialLengthDays={trialLengthDays}
          onUpdateUser={(userId, updates) => updateUser.mutate({ userId, updates })}
          onExtendTrial={(userId, days) => extendTrial.mutate({ userId, days })}
        />
      )}
      {section === "demos" && (
        <AdminDemoRequests
          demoRequests={demoRequests}
          isLoading={demosLoading}
          onUpdateStatus={(id, status) => updateStatus.mutate({ id, status })}
          onUpdateNotes={(id, notes, follow_up_date) =>
            updateNotes.mutate({ id, notes, follow_up_date })
          }
        />
      )}
      {section === "calendar" && (
        <AdminCalendar
          events={events}
          isLoading={eventsLoading}
          onAddEvent={(event) => addEvent.mutate(event)}
          onDeleteEvent={(id) => deleteEvent.mutate(id)}
        />
      )}
      {section === "settings" && (
        <AdminSettings
          settings={settings}
          isLoading={settingsLoading}
          onSave={(key, value) => updateSetting.mutate({ key, value })}
        />
      )}
    </AdminLayout>
  );
}

import { useState } from 'react';
import { Users, Plus, Upload } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ContactStatsRow } from '@/components/crm/ContactStatsRow';
import { ContactsView } from '@/components/crm/ContactsView';
import { PipelineView } from '@/components/crm/PipelineView';
import { CRMCalendarView } from '@/components/crm/CRMCalendarView';
import { ActivityFeedView } from '@/components/crm/ActivityFeedView';
import { AddContactModal } from '@/components/crm/AddContactModal';
import { useContacts } from '@/hooks/useCRM';
import { useCRMCalendar } from '@/hooks/useCRM';
import { useActivities } from '@/hooks/useCRM';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { CRMContact, CRMCalendarEvent, ContactStatus } from '@/types/crm';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase } from '@/integrations/supabase/client';

type CRMView = 'contacts' | 'pipeline' | 'calendar' | 'activity';

const TABS: { id: CRMView; label: string }[] = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'calendar', label: 'CRM Calendar' },
  { id: 'activity', label: 'Activity Feed' },
];

export default function CRM() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<CRMView>('contacts');
  const [addOpen, setAddOpen] = useState(false);

  const { contacts, isLoading, createContact, deleteContacts, moveContactStatus } = useContacts();
  const { events, createEvent, updateEvent } = useCRMCalendar();
  const { activities } = useActivities();

  const handleAddContact = async (
    payload: Omit<CRMContact, 'id' | 'created_at' | 'updated_at'>,
    followUp?: Omit<CRMCalendarEvent, 'id' | 'created_at' | 'updated_at' | 'contact_name'>,
  ) => {
    const newContact = await createContact.mutateAsync(payload);
    if (followUp && newContact?.id) {
      // Log contact_created activity
      await (supabase.from('crm_activities' as any) as any).insert({
        contact_id: newContact.id,
        user_id: user?.id,
        activity_type: 'contact_created',
        description: `Contact added`,
        activity_date: new Date().toISOString(),
      });
      // Create follow-up calendar event
      await createEvent.mutateAsync({ ...followUp, contact_id: newContact.id });
    }
  };

  const handleStatusChange = (id: string, status: ContactStatus) => {
    moveContactStatus.mutate({ id, status });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Lead management for real estate investors</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast({ title: 'CSV Import coming soon' })}>
              <Upload className="h-4 w-4 mr-1.5" /> Import
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Contact
            </Button>
          </div>
        </div>

        {/* Stats */}
        <ContactStatsRow contacts={contacts} />

        {/* View tabs */}
        <div className="flex border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                view === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.id === 'contacts' && contacts.length > 0 && (
                <span className="ml-1.5 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                  {contacts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {!isLoading && contacts.length === 0 && view !== 'activity' ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <div className="rounded-full bg-primary/10 p-5 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No contacts yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Add your first contact or import a list to start managing your real estate leads.
            </p>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Contact
              </Button>
              <Button variant="outline" onClick={() => toast({ title: 'CSV Import coming soon' })}>
                <Upload className="h-4 w-4 mr-1.5" /> Import CSV
              </Button>
            </div>
          </div>
        ) : (
          <>
            {view === 'contacts' && (
              <ContactsView
                contacts={contacts}
                onDelete={ids => deleteContacts.mutate(ids)}
                onStatusChange={handleStatusChange}
              />
            )}
            {view === 'pipeline' && (
              <PipelineView
                contacts={contacts}
                onMove={(id, status) => moveContactStatus.mutate({ id, status })}
              />
            )}
            {view === 'calendar' && (
              <CRMCalendarView
                events={events}
                contacts={contacts}
                onCreateEvent={e => createEvent.mutate(e)}
                onUpdateEvent={(id, updates) => updateEvent.mutate({ id, ...updates })}
              />
            )}
            {view === 'activity' && (
              <ActivityFeedView activities={activities} />
            )}
          </>
        )}
      </div>

      <AddContactModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddContact}
      />
    </MainLayout>
  );
}

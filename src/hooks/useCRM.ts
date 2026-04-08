import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CRMContact, CRMActivity, CRMCalendarEvent, CRMOffer, ContactStatus } from '@/types/crm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (name: string) => supabase.from(name as any);

// ─── Contacts ──────────────────────────────────────────────────────────────

export function useContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<CRMContact[]>({
    queryKey: ['crm_contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await t('crm_contacts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CRMContact[];
    },
  });

  const createContact = useMutation({
    mutationFn: async (payload: Omit<CRMContact, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await t('crm_contacts').insert(payload).select().single();
      if (error) throw error;
      return data as unknown as CRMContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_contacts', user?.id] });
      toast({ title: 'Contact added' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CRMContact> & { id: string }) => {
      const { data, error } = await t('crm_contacts').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as CRMContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_contacts', user?.id] });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteContacts = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await t('crm_contacts').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_contacts', user?.id] });
      toast({ title: 'Contacts deleted' });
    },
  });

  // Optimistic pipeline status move
  const moveContactStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactStatus }) => {
      const { error } = await t('crm_contacts').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['crm_contacts', user?.id] });
      const previous = queryClient.getQueryData<CRMContact[]>(['crm_contacts', user?.id]);
      queryClient.setQueryData<CRMContact[]>(['crm_contacts', user?.id], old =>
        (old ?? []).map(c => c.id === id ? { ...c, status } : c),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(['crm_contacts', user?.id], ctx?.previous);
    },
  });

  return { contacts, isLoading, createContact, updateContact, deleteContacts, moveContactStatus };
}

// ─── Single Contact ─────────────────────────────────────────────────────────

export function useContact(id: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contact, isLoading } = useQuery<CRMContact | null>({
    queryKey: ['crm_contact', id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await t('crm_contacts').select('*').eq('id', id).single();
      if (error) throw error;
      return data as unknown as CRMContact;
    },
  });

  const updateContact = useMutation({
    mutationFn: async (payload: Partial<CRMContact>) => {
      const { error } = await t('crm_contacts').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_contact', id] });
      queryClient.invalidateQueries({ queryKey: ['crm_contacts', user?.id] });
      toast({ title: 'Contact updated' });
    },
  });

  return { contact, isLoading, updateContact };
}

// ─── Activities ─────────────────────────────────────────────────────────────

export function useActivities(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: activities = [], isLoading } = useQuery<CRMActivity[]>({
    queryKey: contactId ? ['crm_activities', contactId] : ['crm_activities_all', user?.id],
    enabled: !!user,
    queryFn: async () => {
      let query = t('crm_activities')
        .select('*, crm_contacts(first_name, last_name)')
        .order('activity_date', { ascending: false });
      if (contactId) query = query.eq('contact_id', contactId);
      else query = query.eq('user_id', user!.id).limit(100);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        contact_name: a.crm_contacts
          ? `${a.crm_contacts.first_name} ${a.crm_contacts.last_name}`
          : undefined,
        crm_contacts: undefined,
      })) as CRMActivity[];
    },
  });

  const logActivity = useMutation({
    mutationFn: async (payload: Omit<CRMActivity, 'id' | 'created_at' | 'contact_name'>) => {
      const { error } = await t('crm_activities').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      if (contactId) queryClient.invalidateQueries({ queryKey: ['crm_activities', contactId] });
      queryClient.invalidateQueries({ queryKey: ['crm_activities_all', user?.id] });
      toast({ title: 'Activity logged' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await t('crm_activities').delete().eq('id', activityId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (contactId) queryClient.invalidateQueries({ queryKey: ['crm_activities', contactId] });
    },
  });

  return { activities, isLoading, logActivity, deleteActivity };
}

// ─── CRM Calendar Events ─────────────────────────────────────────────────────

export function useCRMCalendar(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<CRMCalendarEvent[]>({
    queryKey: contactId ? ['crm_events', contactId] : ['crm_events_all', user?.id],
    enabled: !!user,
    queryFn: async () => {
      let query = t('crm_calendar_events')
        .select('*, crm_contacts(first_name, last_name)')
        .order('event_date', { ascending: true });
      if (contactId) query = query.eq('contact_id', contactId);
      else query = query.eq('user_id', user!.id);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((e: any) => ({
        ...e,
        contact_name: e.crm_contacts ? `${e.crm_contacts.first_name} ${e.crm_contacts.last_name}` : undefined,
        crm_contacts: undefined,
      })) as CRMCalendarEvent[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (payload: Omit<CRMCalendarEvent, 'id' | 'created_at' | 'updated_at' | 'contact_name'>) => {
      const { error } = await t('crm_calendar_events').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_events_all', user?.id] });
      if (contactId) queryClient.invalidateQueries({ queryKey: ['crm_events', contactId] });
      toast({ title: 'Event scheduled' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CRMCalendarEvent> & { id: string }) => {
      const { error } = await t('crm_calendar_events').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_events_all', user?.id] });
      if (contactId) queryClient.invalidateQueries({ queryKey: ['crm_events', contactId] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await t('crm_calendar_events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_events_all', user?.id] });
    },
  });

  return { events, isLoading, createEvent, updateEvent, deleteEvent };
}

// ─── Offers ─────────────────────────────────────────────────────────────────

export function useOffers(contactId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: offers = [] } = useQuery<CRMOffer[]>({
    queryKey: ['crm_offers', contactId],
    enabled: !!contactId && !!user,
    queryFn: async () => {
      const { data, error } = await t('crm_offers')
        .select('*').eq('contact_id', contactId).order('offer_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CRMOffer[];
    },
  });

  const addOffer = useMutation({
    mutationFn: async (payload: Omit<CRMOffer, 'id' | 'created_at'>) => {
      const { error } = await t('crm_offers').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_offers', contactId] });
      toast({ title: 'Offer logged' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await t('crm_offers').delete().eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm_offers', contactId] }),
  });

  return { offers, addOffer, deleteOffer };
}

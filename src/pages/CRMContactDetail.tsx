import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, Phone, Mail, Calendar,
  Plus, Trash2, Ban, Clock, DollarSign,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ContactStatusBadge, ContactTypeBadge, WarmthIndicator, PriorityDot } from '@/components/crm/CRMStatusBadge';
import { LogActivityModal } from '@/components/crm/LogActivityModal';
import { AddContactModal } from '@/components/crm/AddContactModal';
import { ACTIVITY_TYPE_LABELS, CONTACT_TYPE_LABELS, CRM_EVENT_TYPE_CONFIG } from '@/types/crm';
import type { CRMActivity, CRMCalendarEvent, CRMOffer, CRMContact, ActivityType } from '@/types/crm';
import { useContact, useActivities, useCRMCalendar, useOffers } from '@/hooks/useCRM';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

function daysBetween(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm text-right break-words max-w-[60%]">{value ?? '—'}</span>
    </div>
  );
}

function ActivityItem({ activity }: { activity: CRMActivity }) {
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-medium">
        {ACTIVITY_TYPE_LABELS[activity.activity_type]?.slice(0, 1) ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{ACTIVITY_TYPE_LABELS[activity.activity_type] ?? activity.activity_type}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{fmtDate(activity.activity_date)}</span>
        </div>
        {activity.description && <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>}
        {activity.outcome && <p className="text-xs italic text-muted-foreground">→ {activity.outcome}</p>}
        {activity.notes && <p className="text-xs text-muted-foreground">{activity.notes}</p>}
      </div>
    </div>
  );
}

function OfferRow({ offer }: { offer: CRMOffer }) {
  const responseColors: Record<string, string> = {
    pending: 'text-warning', accepted: 'text-success', countered: 'text-blue-400', rejected: 'text-destructive',
  };
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold">{fmt(offer.offer_amount)}</p>
        <p className="text-xs text-muted-foreground">{offer.method} · {new Date(offer.offer_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
      <div className="text-right">
        <span className={cn('text-sm font-medium capitalize', responseColors[offer.response] ?? '')}>{offer.response}</span>
        {offer.counter_amount && <p className="text-xs text-muted-foreground">Counter: {fmt(offer.counter_amount)}</p>}
      </div>
    </div>
  );
}

export default function CRMContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logOpen, setLogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  
  const [newOffer, setNewOffer] = useState({ offer_date: '', offer_amount: '', method: 'verbal', response: 'pending', counter_amount: '', notes: '' });

  const { contact, isLoading, updateContact } = useContact(id!);
  const { activities, logActivity } = useActivities(id!);
  const { events, createEvent } = useCRMCalendar(id!);
  const { offers, addOffer } = useOffers(id!);

  if (isLoading) return <MainLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div></MainLayout>;
  if (!contact) return <MainLayout><div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-muted-foreground">Contact not found.</p><Button variant="outline" onClick={() => navigate('/crm')}>Back to CRM</Button></div></MainLayout>;

  const fullName = `${contact.first_name} ${contact.last_name}`;
  const daysSince = daysBetween(contact.created_at, new Date().toISOString());


  const handleSubmitOffer = () => {
    if (!newOffer.offer_date || !newOffer.offer_amount) return;
    addOffer.mutate({
      contact_id: id!,
      user_id: user?.id ?? '',
      offer_date: newOffer.offer_date,
      offer_amount: parseFloat(newOffer.offer_amount) || 0,
      method: newOffer.method as any,
      response: newOffer.response as any,
      counter_amount: newOffer.counter_amount ? parseFloat(newOffer.counter_amount) : null,
      notes: newOffer.notes || null,
    });
    setOfferOpen(false);
    setNewOffer({ offer_date: '', offer_amount: '', method: 'verbal', response: 'pending', counter_amount: '', notes: '' });
  };

  const handleEdit = async (payload: Omit<CRMContact, 'id' | 'created_at' | 'updated_at'>) => {
    updateContact.mutate(payload);
    setEditOpen(false);
  };

  const followUpEvents = events.filter(e => e.status === 'scheduled');
  const nextFollowUp = followUpEvents.length > 0
    ? followUpEvents.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())[0]
    : null;

  const daysUntilFollowUp = nextFollowUp
    ? Math.ceil((new Date(nextFollowUp.event_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/crm')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <PriorityDot priority={contact.priority} />
                <h1 className="text-xl font-bold">{fullName}</h1>
                <WarmthIndicator contact={contact} />
                <ContactTypeBadge type={contact.contact_type} />
                <ContactStatusBadge status={contact.status} />
                {contact.is_dnc && (
                  <Badge variant="outline" className="text-xs bg-destructive/20 text-destructive border-destructive/30">
                    <Ban className="h-3 w-3 mr-1" /> DNC
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{contact.source} · {daysSince} days since first contact</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`sms:${contact.phone}`}><MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Text</a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLogOpen(true)}>
              <Clock className="h-3.5 w-3.5 mr-1.5" /> Log Activity
            </Button>
            {!contact.is_dnc && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDncConfirm(true)}>
                <Ban className="h-3.5 w-3.5 mr-1.5" /> Mark DNC
              </Button>
            )}
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
            </Button>
          </div>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Phone', value: <span className="text-xs">{contact.phone}</span> },
            { label: 'Email', value: contact.email ? <a href={`mailto:${contact.email}`} className="text-primary hover:underline text-xs truncate">{contact.email}</a> : '—' },
            { label: 'Status', value: <ContactStatusBadge status={contact.status} /> },
            { label: 'Last Contact', value: contact.last_contacted_at ? new Date(contact.last_contacted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' },
            {
              label: 'Next Follow-Up',
              value: daysUntilFollowUp != null
                ? <span className={cn('text-xs font-medium', daysUntilFollowUp < 0 ? 'text-destructive' : daysUntilFollowUp === 0 ? 'text-warning' : 'text-success')}>
                    {daysUntilFollowUp < 0 ? `${Math.abs(daysUntilFollowUp)}d overdue` : daysUntilFollowUp === 0 ? 'Today' : `in ${daysUntilFollowUp}d`}
                  </span>
                : '—',
            },
            { label: 'Days Since Added', value: daysSince.toString() },
          ].map(c => (
            <Card key={c.label} className="glass-card">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <div className="mt-1 text-sm font-semibold flex justify-center">{c.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity ({activities.length})</TabsTrigger>
            <TabsTrigger value="followups">Follow-Ups ({followUpEvents.length})</TabsTrigger>
            <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Contact Info</CardTitle></CardHeader>
                <CardContent>
                  <InfoRow label="Full Name" value={fullName} />
                  <InfoRow label="Phone" value={contact.phone} />
                  {contact.phone_secondary && <InfoRow label="Alt Phone" value={contact.phone_secondary} />}
                  {contact.email && <InfoRow label="Email" value={<a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>} />}
                  <InfoRow label="Type" value={<ContactTypeBadge type={contact.contact_type} />} />
                  <InfoRow label="Source" value={contact.source} />
                  <InfoRow label="Priority" value={<span className="capitalize">{contact.priority ?? '—'}</span>} />
                  {contact.tags && contact.tags.length > 0 && (
                    <InfoRow label="Tags" value={
                      <div className="flex flex-wrap gap-1 justify-end">
                        {contact.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                      </div>
                    } />
                  )}
                </CardContent>
              </Card>

              {(contact.property_address || contact.estimated_arv || contact.asking_price) && (
                <Card className="glass-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Property Info</CardTitle></CardHeader>
                  <CardContent>
                    {contact.property_address && <InfoRow label="Address" value={`${contact.property_address}${contact.property_city ? `, ${contact.property_city}` : ''}${contact.property_state ? `, ${contact.property_state}` : ''}${contact.property_zip ? ` ${contact.property_zip}` : ''}`} />}
                    {contact.property_type && <InfoRow label="Type" value={contact.property_type} />}
                    {contact.bedrooms && <InfoRow label="Beds/Baths" value={`${contact.bedrooms} bd / ${contact.bathrooms ?? '?'} ba`} />}
                    {contact.sqft && <InfoRow label="Sq Ft" value={contact.sqft.toLocaleString()} />}
                    <InfoRow label="ARV" value={fmt(contact.estimated_arv)} />
                    <InfoRow label="Repair Est." value={fmt(contact.estimated_repair)} />
                    <InfoRow label="Asking Price" value={fmt(contact.asking_price)} />
                    <InfoRow label="Offer Amount" value={fmt(contact.offer_amount)} />
                    {contact.estimated_arv && contact.asking_price && (
                      <InfoRow label="Spread" value={
                        <span className="font-semibold text-success">{fmt(contact.estimated_arv - contact.asking_price - (contact.estimated_repair ?? 0))}</span>
                      } />
                    )}
                  </CardContent>
                </Card>
              )}

              {(contact.motivation_level || (contact.reason_for_selling && contact.reason_for_selling.length > 0)) && (
                <Card className="glass-card">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Motivation & Situation</CardTitle></CardHeader>
                  <CardContent>
                    {contact.motivation_level && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Motivation Level</span>
                          <span className="font-semibold text-foreground">{contact.motivation_level}/10</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${contact.motivation_level * 10}%`,
                              backgroundColor: contact.motivation_level >= 7 ? 'hsl(0,72%,51%)' : contact.motivation_level >= 4 ? 'hsl(45,93%,47%)' : 'hsl(200,80%,50%)',
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {contact.reason_for_selling && contact.reason_for_selling.length > 0 && (
                      <InfoRow label="Reason" value={
                        <div className="flex flex-wrap gap-1 justify-end">
                          {contact.reason_for_selling.map(r => <Badge key={r} variant="outline" className="text-xs">{r}</Badge>)}
                        </div>
                      } />
                    )}
                    <InfoRow label="Timeline" value={contact.selling_timeline} />
                    <InfoRow label="Mortgage Balance" value={fmt(contact.mortgage_balance)} />
                    <InfoRow label="Occupied" value={<span className="capitalize">{contact.is_occupied}</span>} />
                    <InfoRow label="Liens/Taxes" value={<span className="capitalize">{contact.has_liens}</span>} />
                  </CardContent>
                </Card>
              )}

              {contact.notes && (
                <Card className="glass-card md:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Notes</CardTitle></CardHeader>
                  <CardContent><p className="text-sm whitespace-pre-wrap">{contact.notes}</p></CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            <div className="mt-4 space-y-2">
              <Button size="sm" onClick={() => setLogOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Log Activity
              </Button>
              {activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No activity logged yet.</div>
              ) : (
                <div className="mt-3">
                  {activities.map(a => <ActivityItem key={a.id} activity={a} />)}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Follow-Ups */}
          <TabsContent value="followups">
            <div className="mt-4 space-y-2">
              {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No follow-ups scheduled.</div>
              ) : (
                events.map(e => (
                  <div key={e.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: CRM_EVENT_TYPE_CONFIG[e.event_type]?.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(e.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        {e.duration_minutes && ` · ${e.duration_minutes} min`}
                      </p>
                      {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
                    </div>
                    <Badge variant="outline" className={cn('text-xs', e.status === 'scheduled' ? 'bg-success/20 text-success border-success/30' : 'bg-muted text-muted-foreground')}>
                      {e.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Offers */}
          <TabsContent value="offers">
            <div className="mt-4 space-y-2">
              <Button size="sm" onClick={() => setOfferOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Log Offer
              </Button>
              {offers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No offers logged yet.</div>
              ) : (
                <Card className="glass-card mt-3">
                  <CardContent className="p-0">
                    {offers.map(o => <OfferRow key={o.id} offer={o} />)}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Log Activity Modal */}
      <LogActivityModal
        open={logOpen}
        onOpenChange={setLogOpen}
        contactId={id!}
        contactName={fullName}
        onLog={activity => logActivity.mutate(activity)}
        onScheduleFollowUp={event => createEvent.mutate(event)}
      />

      {/* Edit Contact Modal */}
      <AddContactModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={contact}
        onSubmit={async (payload) => { await handleEdit(payload); }}
      />

      {/* Log Offer Dialog */}
      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Offer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Offer Date</Label>
                <Input className="mt-1" type="date" value={newOffer.offer_date} onChange={e => setNewOffer(f => ({ ...f, offer_date: e.target.value }))} />
              </div>
              <div>
                <Label>Offer Amount</Label>
                <Input className="mt-1" type="number" value={newOffer.offer_amount} onChange={e => setNewOffer(f => ({ ...f, offer_amount: e.target.value }))} />
              </div>
              <div>
                <Label>Method</Label>
                <Select value={newOffer.method} onValueChange={v => setNewOffer(f => ({ ...f, method: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verbal">Verbal</SelectItem>
                    <SelectItem value="written">Written</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Response</Label>
                <Select value={newOffer.response} onValueChange={v => setNewOffer(f => ({ ...f, response: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="countered">Countered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newOffer.response === 'countered' && (
                <div>
                  <Label>Counter Amount</Label>
                  <Input className="mt-1" type="number" value={newOffer.counter_amount} onChange={e => setNewOffer(f => ({ ...f, counter_amount: e.target.value }))} />
                </div>
              )}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" rows={2} value={newOffer.notes} onChange={e => setNewOffer(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitOffer}>Log Offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}

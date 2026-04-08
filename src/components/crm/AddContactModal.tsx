import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  CONTACT_TYPE_LABELS, LEAD_SOURCES, SELLING_REASONS, formatPhone,
} from '@/types/crm';
import type { CRMContact, ContactType, ContactStatus, CRMCalendarEvent, CRMEventType } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = ['Basic Info', 'Lead Info', 'Property', 'Motivation', 'Follow-Up', 'Notes'];

const PRESET_TAGS = ['Motivated', 'Inherited', 'Pre-Foreclosure', 'Tired Landlord', 'Vacant', 'Free & Clear', 'Absentee Owner'];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (
    contact: Omit<CRMContact, 'id' | 'created_at' | 'updated_at'>,
    followUp?: Omit<CRMCalendarEvent, 'id' | 'created_at' | 'updated_at' | 'contact_name'>,
  ) => Promise<void>;
  initialData?: Partial<CRMContact>;
}

const empty = (userId: string): Omit<CRMContact, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  first_name: '',
  last_name: '',
  phone: '',
  phone_secondary: null,
  email: null,
  contact_type: 'seller',
  contact_type_other: null,
  status: 'new_lead',
  source: 'Cold Call',
  source_other: null,
  tags: [],
  priority: 'medium',
  property_address: null,
  property_city: null,
  property_state: 'TX',
  property_zip: null,
  property_type: null,
  bedrooms: null,
  bathrooms: null,
  sqft: null,
  year_built: null,
  estimated_arv: null,
  estimated_repair: null,
  asking_price: null,
  offer_amount: null,
  property_notes: null,
  motivation_level: null,
  reason_for_selling: [],
  selling_timeline: null,
  mortgage_balance: null,
  is_occupied: 'unknown',
  has_liens: 'unknown',
  previous_wholesale_attempts: false,
  previous_wholesale_details: null,
  is_dnc: false,
  notes: null,
  last_contacted_at: null,
  next_followup_at: null,
});

export function AddContactModal({ open, onOpenChange, onSubmit, initialData }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => empty(user?.id ?? ''));
  const [tagInput, setTagInput] = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState(true);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpType, setFollowUpType] = useState<CRMEventType>('follow_up_call');

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setForm(initialData ? { ...empty(user?.id ?? ''), ...initialData } : empty(user?.id ?? ''));
    setScheduleFollowUp(true);
    setFollowUpDate('');
  }, [open, initialData, user]);

  const set = (field: string, val: any) => setForm(f => ({ ...f, [field]: val }));

  const handlePhoneChange = (field: string, val: string) => {
    set(field, formatPhone(val));
  };

  const toggleTag = (tag: string) => {
    const tags = form.tags ?? [];
    set('tags', tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);
  };

  const addCustomTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const tags = form.tags ?? [];
    if (!tags.includes(t)) set('tags', [...tags, t]);
    setTagInput('');
  };

  const toggleReason = (reason: string) => {
    const reasons = form.reason_for_selling ?? [];
    set('reason_for_selling', reasons.includes(reason) ? reasons.filter(r => r !== reason) : [...reasons, reason]);
  };

  const fmt = (v: number | null | undefined) =>
    v == null ? '' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  const parseCurrency = (s: string): number | null => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let followUp: Omit<CRMCalendarEvent, 'id' | 'created_at' | 'updated_at' | 'contact_name'> | undefined;
      if (scheduleFollowUp && followUpDate) {
        followUp = {
          user_id: user?.id ?? '',
          contact_id: '', // filled in by parent
          title: `Follow-up: ${form.first_name} ${form.last_name}`,
          event_type: followUpType,
          event_date: new Date(followUpDate).toISOString(),
          duration_minutes: 30,
          notes: followUpNote || null,
          reminder: '30m',
          status: 'scheduled',
        };
      }
      await onSubmit(form, followUp);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors',
                  i < step ? 'bg-success text-white cursor-pointer' :
                  i === step ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 rounded', i < step ? 'bg-success' : 'bg-muted')} />}
            </div>
          ))}
        </div>
        <p className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">{STEPS[step]}</p>

        {/* ── Step 0: Basic Info ── */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name <span className="text-destructive">*</span></Label>
              <Input className="mt-1" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="John" />
            </div>
            <div>
              <Label>Last Name <span className="text-destructive">*</span></Label>
              <Input className="mt-1" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Smith" />
            </div>
            <div>
              <Label>Phone Number <span className="text-destructive">*</span></Label>
              <Input className="mt-1" value={form.phone} onChange={e => handlePhoneChange('phone', e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label>Secondary Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input className="mt-1" value={form.phone_secondary ?? ''} onChange={e => handlePhoneChange('phone_secondary', e.target.value)} placeholder="(555) 987-6543" />
            </div>
            <div className="col-span-2">
              <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input className="mt-1" type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value || null)} placeholder="john@example.com" />
            </div>
            <div>
              <Label>Contact Type <span className="text-destructive">*</span></Label>
              <Select value={form.contact_type} onValueChange={v => set('contact_type', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTACT_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.contact_type === 'other' && (
              <div>
                <Label>Describe Type</Label>
                <Input className="mt-1" value={form.contact_type_other ?? ''} onChange={e => set('contact_type_other', e.target.value || null)} />
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Lead Info ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status <span className="text-destructive">*</span></Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['new_lead','hot_lead','contacted','follow_up','negotiating','under_contract','closed_won','closed_lost','dead','dnc'].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <div className="flex gap-2 mt-1">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => set('priority', p)}
                      className={cn(
                        'flex-1 py-1.5 text-sm rounded-md border font-medium transition-colors capitalize',
                        form.priority === p
                          ? p === 'high' ? 'bg-destructive/20 text-destructive border-destructive/40'
                            : p === 'medium' ? 'bg-warning/20 text-warning border-warning/40'
                            : 'bg-muted text-muted-foreground border-border'
                          : 'border-border text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Source <span className="text-destructive">*</span></Label>
                <Select value={form.source} onValueChange={v => set('source', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.source === 'Other' && (
                <div>
                  <Label>Describe Source</Label>
                  <Input className="mt-1" value={form.source_other ?? ''} onChange={e => set('source_other', e.target.value || null)} />
                </div>
              )}
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full border transition-colors',
                      (form.tags ?? []).includes(tag)
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  className="h-8 text-sm"
                  placeholder="Add custom tag…"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                />
                <Button size="sm" variant="outline" onClick={addCustomTag}>Add</Button>
              </div>
              {(form.tags ?? []).filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(form.tags ?? []).filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs gap-1">
                      {tag}
                      <button onClick={() => toggleTag(tag)} className="hover:text-destructive">×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Property Info ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">All property fields are optional.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Property Address</Label>
                <Input className="mt-1" value={form.property_address ?? ''} onChange={e => set('property_address', e.target.value || null)} placeholder="123 Main St" />
              </div>
              <div>
                <Label>City</Label>
                <Input className="mt-1" value={form.property_city ?? ''} onChange={e => set('property_city', e.target.value || null)} />
              </div>
              <div>
                <Label>State</Label>
                <Input className="mt-1" value={form.property_state ?? 'TX'} onChange={e => set('property_state', e.target.value || null)} />
              </div>
              <div>
                <Label>Zip</Label>
                <Input className="mt-1" value={form.property_zip ?? ''} onChange={e => set('property_zip', e.target.value || null)} />
              </div>
              <div>
                <Label>Property Type</Label>
                <Select value={form.property_type ?? ''} onValueChange={v => set('property_type', v || null)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['SFR', 'Duplex', 'Triplex', 'Fourplex', 'Land/Lot', 'Commercial', 'Other'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bedrooms</Label>
                <Input className="mt-1" type="number" value={form.bedrooms ?? ''} onChange={e => set('bedrooms', parseInt(e.target.value) || null)} />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input className="mt-1" type="number" step="0.5" value={form.bathrooms ?? ''} onChange={e => set('bathrooms', parseFloat(e.target.value) || null)} />
              </div>
              <div>
                <Label>Sq Ft</Label>
                <Input className="mt-1" type="number" value={form.sqft ?? ''} onChange={e => set('sqft', parseInt(e.target.value) || null)} />
              </div>
              <div>
                <Label>Year Built</Label>
                <Input className="mt-1" type="number" value={form.year_built ?? ''} onChange={e => set('year_built', parseInt(e.target.value) || null)} />
              </div>
              <div>
                <Label>Estimated ARV</Label>
                <Input className="mt-1" placeholder="$0" value={form.estimated_arv != null ? fmt(form.estimated_arv) : ''} onChange={e => set('estimated_arv', parseCurrency(e.target.value))} />
              </div>
              <div>
                <Label>Estimated Repair Cost</Label>
                <Input className="mt-1" placeholder="$0" value={form.estimated_repair != null ? fmt(form.estimated_repair) : ''} onChange={e => set('estimated_repair', parseCurrency(e.target.value))} />
              </div>
              <div>
                <Label>Asking Price</Label>
                <Input className="mt-1" placeholder="$0" value={form.asking_price != null ? fmt(form.asking_price) : ''} onChange={e => set('asking_price', parseCurrency(e.target.value))} />
              </div>
              <div>
                <Label>Offer Amount</Label>
                <Input className="mt-1" placeholder="$0" value={form.offer_amount != null ? fmt(form.offer_amount) : ''} onChange={e => set('offer_amount', parseCurrency(e.target.value))} />
              </div>
              <div className="col-span-2">
                <Label>Property Notes</Label>
                <Textarea className="mt-1" rows={2} value={form.property_notes ?? ''} onChange={e => set('property_notes', e.target.value || null)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Motivation ── */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">All motivation fields are optional but highly valuable for deal evaluation.</p>
            <div>
              <Label>Motivation Level (1–10)</Label>
              <div className="mt-3 px-1">
                <Slider
                  min={1} max={10} step={1}
                  value={[form.motivation_level ?? 5]}
                  onValueChange={([v]) => set('motivation_level', v)}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Not Motivated</span>
                  <span className="font-semibold text-primary">{form.motivation_level ?? '—'}</span>
                  <span>Very Motivated</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Reason for Selling</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SELLING_REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => toggleReason(r)}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full border transition-colors',
                      (form.reason_for_selling ?? []).includes(r)
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Selling Timeline</Label>
                <Select value={form.selling_timeline ?? ''} onValueChange={v => set('selling_timeline', v || null)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select timeline" /></SelectTrigger>
                  <SelectContent>
                    {['ASAP', '1–2 Weeks', '1 Month', '2–3 Months', '6+ Months', 'No Rush', 'Unknown'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mortgage Balance</Label>
                <Input className="mt-1" placeholder="$0" value={form.mortgage_balance != null ? fmt(form.mortgage_balance) : ''} onChange={e => set('mortgage_balance', parseCurrency(e.target.value))} />
              </div>
              <div>
                <Label>Is Property Occupied?</Label>
                <Select value={form.is_occupied ?? 'unknown'} onValueChange={v => set('is_occupied', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Liens or Back Taxes?</Label>
                <Select value={form.has_liens ?? 'unknown'} onValueChange={v => set('has_liens', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Previous Wholesale Attempts?</p>
              <Switch checked={form.previous_wholesale_attempts} onCheckedChange={v => set('previous_wholesale_attempts', v)} />
            </div>
            {form.previous_wholesale_attempts && (
              <div>
                <Label>Details</Label>
                <Textarea className="mt-1" rows={2} value={form.previous_wholesale_details ?? ''} onChange={e => set('previous_wholesale_details', e.target.value || null)} placeholder="Listed with XYZ at $95K, didn't sell…" />
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Follow-Up ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Schedule First Follow-Up</p>
                <p className="text-xs text-muted-foreground">Creates a CRM calendar event automatically</p>
              </div>
              <Switch checked={scheduleFollowUp} onCheckedChange={setScheduleFollowUp} />
            </div>
            {scheduleFollowUp && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date & Time</Label>
                    <Input className="mt-1" type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Event Type</Label>
                    <Select value={followUpType} onValueChange={v => setFollowUpType(v as CRMEventType)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="follow_up_call">Follow-Up Call</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="general_reminder">General Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Note</Label>
                  <Input className="mt-1" value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="What to discuss…" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Notes ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <Label>General Notes</Label>
              <Textarea className="mt-1" rows={6} placeholder="Any additional context, special circumstances, verbal agreements…" value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving || !form.first_name || !form.last_name || !form.phone}
            >
              {saving ? 'Saving…' : initialData?.id ? 'Save Changes' : 'Add Contact'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

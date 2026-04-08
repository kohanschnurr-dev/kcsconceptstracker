export type ContactType =
  | 'seller' | 'buyer' | 'wholesaler' | 'agent'
  | 'lender' | 'contractor' | 'attorney' | 'title_company' | 'other';

export type ContactStatus =
  | 'new_lead' | 'hot_lead' | 'contacted' | 'follow_up'
  | 'negotiating' | 'under_contract' | 'closed_won' | 'closed_lost' | 'dead' | 'dnc';

export type ActivityType =
  | 'call_outbound' | 'call_inbound' | 'call_no_answer' | 'call_voicemail'
  | 'text_sent' | 'text_received' | 'email_sent' | 'meeting'
  | 'drive_by' | 'note' | 'offer_made' | 'offer_accepted' | 'offer_rejected'
  | 'status_change' | 'contact_created' | 'follow_up_scheduled' | 'other';

export type CRMEventType = 'follow_up_call' | 'appointment' | 'offer_deadline' | 'general_reminder';
export type CRMEventStatus = 'scheduled' | 'completed' | 'missed' | 'rescheduled';

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  seller: 'Seller', buyer: 'Buyer', wholesaler: 'Wholesaler', agent: 'Agent',
  lender: 'Lender', contractor: 'Contractor', attorney: 'Attorney',
  title_company: 'Title Company', other: 'Other',
};

export const CONTACT_STATUS_CONFIG: Record<ContactStatus, { label: string; className: string }> = {
  new_lead:       { label: 'New Lead',        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  hot_lead:       { label: 'Hot Lead',         className: 'bg-destructive/20 text-destructive border-destructive/30' },
  contacted:      { label: 'Contacted',        className: 'bg-primary/20 text-primary border-primary/30' },
  follow_up:      { label: 'Follow-Up',        className: 'bg-warning/20 text-warning border-warning/30' },
  negotiating:    { label: 'Negotiating',      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  under_contract: { label: 'Under Contract',   className: 'bg-success/20 text-success border-success/30' },
  closed_won:     { label: 'Closed Won',       className: 'bg-success/30 text-success border-success/40' },
  closed_lost:    { label: 'Closed Lost',      className: 'bg-muted text-muted-foreground border-border' },
  dead:           { label: 'Dead',             className: 'bg-muted text-muted-foreground border-border' },
  dnc:            { label: 'DNC',              className: 'bg-destructive/30 text-destructive border-destructive/40' },
};

export const PIPELINE_COLUMNS: { id: ContactStatus; label: string }[] = [
  { id: 'new_lead',       label: 'New Lead' },
  { id: 'contacted',      label: 'Contacted' },
  { id: 'follow_up',      label: 'Follow-Up' },
  { id: 'negotiating',    label: 'Negotiating' },
  { id: 'under_contract', label: 'Under Contract' },
  { id: 'closed_won',     label: 'Closed Won' },
  { id: 'dead',           label: 'Dead' },
];

export const CRM_EVENT_TYPE_CONFIG: Record<CRMEventType, { label: string; color: string }> = {
  follow_up_call:   { label: 'Follow-Up Call',    color: 'hsl(42, 100%, 50%)' },
  appointment:      { label: 'Appointment',        color: 'hsl(200, 80%, 50%)' },
  offer_deadline:   { label: 'Offer Deadline',     color: 'hsl(0, 72%, 51%)' },
  general_reminder: { label: 'General Reminder',   color: 'hsl(220, 15%, 50%)' },
};

export const LEAD_SOURCES = [
  'Driving for Dollars', 'Cold Call', 'Direct Mail', 'Referral', 'Wholesaler',
  'MLS / Zillow', 'Facebook / Social Media', 'Website', 'Bandit Sign',
  'Probate List', 'Tax Delinquent List', 'Absentee Owner List', 'Vacant Property List', 'Other',
];

export const SELLING_REASONS = [
  'Inherited / Probate', 'Divorce', 'Relocation', 'Financial Distress / Pre-Foreclosure',
  'Tired Landlord', 'Vacant / Abandoned', 'Tax Delinquent', 'Code Violations',
  'Health Issues', 'Downsizing', 'Other',
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call_outbound:      'Call – Outbound',
  call_inbound:       'Call – Inbound',
  call_no_answer:     'Call – No Answer',
  call_voicemail:     'Call – Voicemail',
  text_sent:          'Text Sent',
  text_received:      'Text Received',
  email_sent:         'Email Sent',
  meeting:            'Meeting',
  drive_by:           'Drive-By',
  note:               'Note',
  offer_made:         'Offer Made',
  offer_accepted:     'Offer Accepted',
  offer_rejected:     'Offer Rejected',
  status_change:      'Status Change',
  contact_created:    'Contact Created',
  follow_up_scheduled:'Follow-Up Scheduled',
  other:              'Other',
};

export interface CRMContact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  phone_secondary: string | null;
  email: string | null;
  contact_type: ContactType;
  contact_type_other: string | null;
  status: ContactStatus;
  source: string;
  source_other: string | null;
  tags: string[] | null;
  priority: 'low' | 'medium' | 'high' | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  year_built: number | null;
  estimated_arv: number | null;
  estimated_repair: number | null;
  asking_price: number | null;
  offer_amount: number | null;
  property_notes: string | null;
  motivation_level: number | null;
  reason_for_selling: string[] | null;
  selling_timeline: string | null;
  mortgage_balance: number | null;
  is_occupied: 'yes' | 'no' | 'unknown' | null;
  has_liens: 'yes' | 'no' | 'unknown' | null;
  previous_wholesale_attempts: boolean;
  previous_wholesale_details: string | null;
  is_dnc: boolean;
  notes: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CRMActivity {
  id: string;
  contact_id: string;
  user_id: string;
  activity_type: ActivityType;
  description: string | null;
  outcome: string | null;
  duration_minutes: number | null;
  notes: string | null;
  activity_date: string;
  created_at: string;
  // joined
  contact_name?: string;
}

export interface CRMCalendarEvent {
  id: string;
  contact_id: string;
  user_id: string;
  title: string;
  event_type: CRMEventType;
  event_date: string;
  duration_minutes: number | null;
  notes: string | null;
  reminder: string | null;
  status: CRMEventStatus;
  created_at: string;
  updated_at: string;
  // joined
  contact_name?: string;
}

export interface CRMOffer {
  id: string;
  contact_id: string;
  user_id: string;
  offer_date: string;
  offer_amount: number;
  method: 'verbal' | 'written' | 'email';
  response: 'pending' | 'accepted' | 'countered' | 'rejected';
  counter_amount: number | null;
  notes: string | null;
  created_at: string;
}

/** Format phone number as (xxx) xxx-xxxx */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

/** Compute a 0–10 lead warmth score from status + motivation */
export function getWarmthScore(contact: Pick<CRMContact, 'status' | 'motivation_level' | 'last_contacted_at'>): number {
  const statusScore: Record<ContactStatus, number> = {
    new_lead: 2, hot_lead: 9, contacted: 4, follow_up: 5,
    negotiating: 8, under_contract: 10, closed_won: 10,
    closed_lost: 0, dead: 0, dnc: 0,
  };
  let score = statusScore[contact.status] ?? 2;
  if (contact.motivation_level) score = (score + contact.motivation_level) / 2;
  if (contact.last_contacted_at) {
    const days = Math.floor((Date.now() - new Date(contact.last_contacted_at).getTime()) / 86400000);
    if (days <= 7) score = Math.min(score + 1, 10);
    else if (days > 30) score = Math.max(score - 1, 0);
  }
  return Math.round(score);
}

export function getWarmthColor(score: number): string {
  if (score >= 8) return 'text-destructive';
  if (score >= 5) return 'text-warning';
  if (score >= 3) return 'text-blue-400';
  return 'text-muted-foreground';
}

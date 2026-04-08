import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, MessageSquare, Mail, Users, FileText,
  DollarSign, Calendar, AlignLeft, ChevronRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ACTIVITY_TYPE_LABELS } from '@/types/crm';
import type { CRMActivity, ActivityType } from '@/types/crm';
import { cn } from '@/lib/utils';

const ACTIVITY_ICONS: Partial<Record<ActivityType, React.ElementType>> = {
  call_outbound: Phone, call_inbound: Phone, call_no_answer: Phone, call_voicemail: Phone,
  text_sent: MessageSquare, text_received: MessageSquare,
  email_sent: Mail, meeting: Users, drive_by: ChevronRight,
  note: AlignLeft, offer_made: DollarSign, offer_accepted: DollarSign, offer_rejected: DollarSign,
  status_change: ChevronRight, contact_created: Users, follow_up_scheduled: Calendar, other: FileText,
};

const ACTIVITY_COLORS: Partial<Record<ActivityType, string>> = {
  call_outbound: 'text-primary bg-primary/10',
  call_inbound: 'text-success bg-success/10',
  call_no_answer: 'text-muted-foreground bg-muted',
  call_voicemail: 'text-warning bg-warning/10',
  text_sent: 'text-blue-400 bg-blue-500/10',
  text_received: 'text-blue-400 bg-blue-500/10',
  email_sent: 'text-purple-400 bg-purple-500/10',
  meeting: 'text-primary bg-primary/10',
  note: 'text-muted-foreground bg-muted',
  offer_made: 'text-warning bg-warning/10',
  offer_accepted: 'text-success bg-success/10',
  offer_rejected: 'text-destructive bg-destructive/10',
  status_change: 'text-muted-foreground bg-muted',
  contact_created: 'text-success bg-success/10',
  follow_up_scheduled: 'text-primary bg-primary/10',
};

function fmtTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7) return `${diffD}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffD > 365 ? 'numeric' : undefined });
}

interface ActivityFeedViewProps {
  activities: CRMActivity[];
}

export function ActivityFeedView({ activities }: ActivityFeedViewProps) {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...activities];
    if (typeFilter !== 'all') list = list.filter(a => a.activity_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        (a.contact_name ?? '').toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q) ||
        (a.notes ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [activities, typeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Input placeholder="Search activities…" value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
        </div>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No activity logged yet.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((activity, i) => {
            const Icon = ACTIVITY_ICONS[activity.activity_type] ?? FileText;
            const colorClass = ACTIVITY_COLORS[activity.activity_type] ?? 'text-muted-foreground bg-muted';
            const [iconColor, iconBg] = colorClass.split(' ');
            return (
              <div key={activity.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                {/* Icon + timeline line */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', iconBg)}>
                    <Icon className={cn('h-4 w-4', iconColor)} />
                  </div>
                  {i < filtered.length - 1 && <div className="w-px flex-1 bg-border min-h-3" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activity.contact_name && (
                        <button
                          onClick={() => navigate(`/crm/${activity.contact_id}`)}
                          className="font-semibold text-sm hover:text-primary transition-colors"
                        >
                          {activity.contact_name}
                        </button>
                      )}
                      <span className="text-sm text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">
                        {ACTIVITY_TYPE_LABELS[activity.activity_type] ?? activity.activity_type}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{fmtTime(activity.activity_date)}</span>
                  </div>
                  {activity.description && (
                    <p className="text-sm mt-0.5">{activity.description}</p>
                  )}
                  {activity.outcome && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">Outcome: {activity.outcome}</p>
                  )}
                  {activity.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.notes}</p>
                  )}
                  {activity.duration_minutes && (
                    <span className="text-xs text-muted-foreground">{activity.duration_minutes} min</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

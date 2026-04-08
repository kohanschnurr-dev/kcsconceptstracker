import { useMemo } from 'react';
import { Users, Flame, Bell, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CRMContact } from '@/types/crm';

interface ContactStatsRowProps {
  contacts: CRMContact[];
}

export function ContactStatsRow({ contacts }: ContactStatsRowProps) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const stats = useMemo(() => {
    const total = contacts.length;
    const activeLeads = contacts.filter(c => c.status === 'new_lead' || c.status === 'hot_lead').length;
    const followUpsDue = contacts.filter(c => {
      if (!c.next_followup_at || c.is_dnc) return false;
      return new Date(c.next_followup_at) <= todayEnd;
    }).length;
    const pipeline = contacts.filter(c =>
      c.status === 'under_contract' || c.status === 'negotiating',
    ).length;
    return { total, activeLeads, followUpsDue, pipeline };
  }, [contacts]);

  const cards = [
    {
      title: 'Total Contacts',
      value: stats.total,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Active Leads',
      value: stats.activeLeads,
      icon: Flame,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      title: 'Follow-Ups Due',
      value: stats.followUpsDue,
      icon: Bell,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Deals in Pipeline',
      value: stats.pipeline,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <Card key={c.title} className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{c.title}</p>
                <p className="mt-1 text-2xl font-bold">{c.value}</p>
              </div>
              <div className={cn('rounded-lg p-2.5 flex-shrink-0', c.bg)}>
                <c.icon className={cn('h-5 w-5', c.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

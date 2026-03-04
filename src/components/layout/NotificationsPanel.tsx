import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import {
  ShoppingCart,
  DollarSign,
  ClipboardList,
  CheckSquare,
  StickyNote,
  FolderPlus,
  RefreshCw,
  MessageCircle,
  Bell,
  CheckCheck,
  ChevronRight,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type Notification, useNotifications } from '@/hooks/useNotifications';
import { MessageThreadPanel } from './MessageThreadPanel';

// ── TypeScript event types ──────────────────────────────────────────────────

interface EventMeta {
  Icon: React.ElementType;
  colour: string;
  bg: string;
  ring: string;
  label: string;
}

const EVENT_META: Record<Notification['event_type'], EventMeta> = {
  order_request: {
    Icon: ShoppingCart,
    colour: 'text-orange-400',
    bg: 'bg-orange-400/12',
    ring: 'ring-orange-400/20',
    label: 'Order',
  },
  expense: {
    Icon: DollarSign,
    colour: 'text-red-400',
    bg: 'bg-red-400/12',
    ring: 'ring-red-400/20',
    label: 'Expense',
  },
  daily_log: {
    Icon: ClipboardList,
    colour: 'text-blue-400',
    bg: 'bg-blue-400/12',
    ring: 'ring-blue-400/20',
    label: 'Daily Log',
  },
  task_completed: {
    Icon: CheckSquare,
    colour: 'text-green-400',
    bg: 'bg-green-400/12',
    ring: 'ring-green-400/20',
    label: 'Task',
  },
  project_note: {
    Icon: StickyNote,
    colour: 'text-yellow-400',
    bg: 'bg-yellow-400/12',
    ring: 'ring-yellow-400/20',
    label: 'Note',
  },
  project_created: {
    Icon: FolderPlus,
    colour: 'text-purple-400',
    bg: 'bg-purple-400/12',
    ring: 'ring-purple-400/20',
    label: 'Project',
  },
  project_status: {
    Icon: RefreshCw,
    colour: 'text-cyan-400',
    bg: 'bg-cyan-400/12',
    ring: 'ring-cyan-400/20',
    label: 'Status',
  },
  direct_message: {
    Icon: MessageCircle,
    colour: 'text-pink-400',
    bg: 'bg-pink-400/12',
    ring: 'ring-pink-400/20',
    label: 'Message',
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildDescription(n: Notification): string {
  const p = n.payload as Record<string, string | number>;
  const actor = (p.actorName as string) || 'Someone';

  switch (n.event_type) {
    case 'order_request': {
      const count = p.itemCount ? ` (${p.itemCount} items)` : '';
      return `${actor} submitted an order request${count}`;
    }
    case 'expense': {
      const amt = p.amount != null ? ` $${Number(p.amount).toLocaleString()}` : '';
      const proj = p.projectName ? ` on ${p.projectName}` : '';
      return `${actor} logged a${amt} expense${proj}`;
    }
    case 'daily_log': {
      const proj = p.projectName ? ` for ${p.projectName}` : '';
      const date = p.logDate ? ` on ${p.logDate}` : '';
      return `${actor} added a daily log${proj}${date}`;
    }
    case 'task_completed': {
      const title = p.taskTitle ? `: "${p.taskTitle}"` : '';
      return `${actor} completed a task${title}`;
    }
    case 'project_note': {
      const proj = p.projectName ? ` on ${p.projectName}` : '';
      return `${actor} left a note${proj}`;
    }
    case 'project_created':
      return `${actor} created a new project: ${p.projectName || ''}`;
    case 'project_status': {
      const proj = p.projectName ? String(p.projectName) : 'a project';
      const status = p.newStatus
        ? ` to ${String(p.newStatus).replace('_', ' ')}`
        : '';
      return `${actor} changed ${proj} status${status}`;
    }
    case 'direct_message': {
      const preview = p.messagePreview ? `"${p.messagePreview}"` : '';
      return `${actor} sent you a message ${preview}`;
    }
    default:
      return 'New activity';
  }
}

function getRoute(n: Notification): string | null {
  const p = n.payload as Record<string, string>;
  switch (n.event_type) {
    case 'order_request':
      return '/procurement';
    case 'expense':
      return p.projectId ? `/projects/${p.projectId}?tab=expenses` : '/expenses';
    case 'daily_log':
      return p.projectId ? `/projects/${p.projectId}?tab=logs` : '/logs';
    case 'task_completed':
      return p.projectId ? `/projects/${p.projectId}?tab=tasks` : null;
    case 'project_note':
      return p.projectId ? `/projects/${p.projectId}?tab=notes` : null;
    case 'project_created':
    case 'project_status':
      return p.projectId ? `/projects/${p.projectId}` : '/projects';
    case 'direct_message':
      return null; // opens thread view inline
    default:
      return null;
  }
}

function groupNotifications(
  notifications: Notification[]
): Array<{ label: string; items: Notification[] }> {
  const buckets: Record<string, Notification[]> = {};

  for (const n of notifications) {
    const date = new Date(n.created_at);
    let bucket: string;
    if (isToday(date)) bucket = 'Today';
    else if (isYesterday(date)) bucket = 'Yesterday';
    else if (isThisWeek(date, { weekStartsOn: 1 })) bucket = 'This Week';
    else bucket = 'Earlier';

    if (!buckets[bucket]) buckets[bucket] = [];
    buckets[bucket].push(n);
  }

  const ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  return ORDER.filter((l) => buckets[l]?.length).map((label) => ({
    label,
    items: buckets[label],
  }));
}

// ── Skeleton loader ──────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 bg-muted rounded w-4/5" />
        <div className="h-3 bg-muted rounded w-2/5" />
      </div>
    </div>
  );
}

// ── Notification card ────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate: (route: string | null, id: string) => void;
  onOpenThread: (actorId: string, actorName: string, teamId: string) => void;
}

function NotificationCard({
  notification,
  onMarkRead,
  onNavigate,
  onOpenThread,
}: NotificationCardProps) {
  const meta = EVENT_META[notification.event_type];
  const { Icon, colour, bg, ring, label } = meta;
  const description = buildDescription(notification);
  const route = getRoute(notification);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  const handleClick = () => {
    if (!notification.is_read) onMarkRead(notification.id);

    if (notification.event_type === 'direct_message') {
      const p = notification.payload as Record<string, string>;
      onOpenThread(
        notification.actor_id,
        p.actorName || 'Team Member',
        p.teamId || ''
      );
    } else {
      onNavigate(route, notification.id);
    }
  };

  const isNavigable =
    route !== null || notification.event_type === 'direct_message';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group w-full text-left flex items-start gap-3 px-4 py-3.5 transition-all duration-150 relative',
        'hover:bg-muted/40 active:bg-muted/60',
        !notification.is_read && 'bg-primary/[0.04]'
      )}
    >
      {/* Unread accent strip */}
      {!notification.is_read && (
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary" />
      )}

      {/* Icon circle */}
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ring-1',
          bg,
          ring,
          colour
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug break-words',
            notification.is_read
              ? 'text-muted-foreground'
              : 'text-foreground font-medium'
          )}
        >
          {description}
        </p>

        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {/* Category chip */}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
              bg,
              ring,
              colour
            )}
          >
            {label}
          </span>

          {/* Relative time */}
          <span className="text-[11px] text-muted-foreground/80">{timeAgo}</span>
        </div>
      </div>

      {/* Navigation arrow */}
      {isNavigable && (
        <ChevronRight
          className={cn(
            'mt-1 h-4 w-4 flex-shrink-0 transition-transform duration-150',
            'text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5'
          )}
        />
      )}
    </button>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Bell className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary/10 ring-2 ring-background flex items-center justify-center">
          <CheckCheck className="h-3 w-3 text-primary" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">All caught up</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
          When your team logs expenses, completes tasks, or sends messages, you'll
          see it here in real time.
        </p>
      </div>
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────────────────

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({
  open,
  onOpenChange,
}: NotificationsPanelProps) {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useNotifications();
  const navigate = useNavigate();

  const [view, setView] = useState<'notifications' | 'thread'>('notifications');
  const [threadActor, setThreadActor] = useState<{
    id: string;
    name: string;
    teamId: string;
  } | null>(null);

  const handleNavigate = (route: string | null) => {
    if (route) {
      onOpenChange(false);
      navigate(route);
    }
  };

  const handleOpenThread = (
    actorId: string,
    actorName: string,
    teamId: string
  ) => {
    setThreadActor({ id: actorId, name: actorName, teamId });
    setView('thread');
  };

  const handleBack = () => {
    setView('notifications');
    setThreadActor(null);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setView('notifications');
      setThreadActor(null);
    }
    onOpenChange(v);
  };

  const groups = groupNotifications(notifications);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="w-[22rem] p-0 flex flex-col border-r border-border bg-background"
      >
        {view === 'thread' && threadActor ? (
          <MessageThreadPanel
            pmId={threadActor.id}
            pmName={threadActor.name}
            teamId={threadActor.teamId}
            onBack={handleBack}
          />
        ) : (
          <>
            {/* ── Header ── */}
            <SheetHeader className="flex-shrink-0 border-b border-border">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SheetTitle className="text-sm font-semibold text-foreground">
                      Notifications
                    </SheetTitle>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                    onClick={markAllRead}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
              </div>
            </SheetHeader>

            {/* ── Body ── */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="divide-y divide-border/50">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <NotificationSkeleton key={i} />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <div>
                  {groups.map(({ label, items }) => (
                    <div key={label}>
                      {/* Date group header */}
                      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm px-5 py-2 border-b border-border/40">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          {label}
                        </span>
                      </div>

                      <div className="divide-y divide-border/30">
                        {items.map((n) => (
                          <NotificationCard
                            key={n.id}
                            notification={n}
                            onMarkRead={markRead}
                            onNavigate={(route) => handleNavigate(route)}
                            onOpenThread={handleOpenThread}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Bottom padding */}
                  <div className="h-4" />
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

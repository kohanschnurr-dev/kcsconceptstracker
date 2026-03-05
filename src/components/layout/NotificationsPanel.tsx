import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ShoppingCart,
  Receipt,
  ClipboardList,
  CheckSquare,
  FileText,
  FolderPlus,
  RefreshCw,
  MessageCircle,
  Bell,
  CheckCheck,
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

/* ── Icon + colour per event type ── */
const EVENT_META: Record<
  Notification['event_type'],
  { Icon: React.ElementType; colour: string; label: string }
> = {
  order_request: { Icon: ShoppingCart, colour: 'text-orange-500', label: 'Order Request' },
  expense: { Icon: Receipt, colour: 'text-red-500', label: 'Expense' },
  daily_log: { Icon: ClipboardList, colour: 'text-blue-500', label: 'Daily Log' },
  task_completed: { Icon: CheckSquare, colour: 'text-green-500', label: 'Task' },
  project_note: { Icon: FileText, colour: 'text-yellow-500', label: 'Note' },
  project_created: { Icon: FolderPlus, colour: 'text-purple-500', label: 'Project' },
  project_status: { Icon: RefreshCw, colour: 'text-cyan-500', label: 'Status' },
  direct_message: { Icon: MessageCircle, colour: 'text-pink-500', label: 'Message' },
};

/* ── Build human-readable description from payload ── */
function buildDescription(n: Notification): string {
  const p = n.payload as Record<string, string | number>;
  const actor = (p.actorName as string) || 'Someone';

  switch (n.event_type) {
    case 'order_request': {
      const count = p.itemCount ? ` (${p.itemCount} items)` : '';
      return `${actor} submitted an order request${count}`;
    }
    case 'expense': {
      const amt = p.amount != null ? `$${Number(p.amount).toLocaleString()}` : '';
      const proj = p.projectName ? ` on ${p.projectName}` : '';
      return `${actor} logged a ${amt} expense${proj}`;
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
      const proj = p.projectName ? `${p.projectName}` : 'a project';
      const status = p.newStatus ? ` to ${String(p.newStatus).replace('_', ' ')}` : '';
      return `${actor} changed ${proj} status${status}`;
    }
    case 'direct_message': {
      const preview = p.messagePreview ? `"${p.messagePreview}"` : '';
      return `${actor} sent you a message: ${preview}`;
    }
    default:
      return 'New activity';
  }
}

/* ── Derive navigation route ── */
function getRoute(n: Notification): string | null {
  const p = n.payload as Record<string, string>;
  switch (n.event_type) {
    case 'order_request':
      return '/procurement';
    case 'expense':
      return p.projectId ? `/projects/${p.projectId}?tab=expenses` : '/expenses';
    case 'daily_log':
      return '/logs';
    case 'task_completed':
      return p.projectId ? `/projects/${p.projectId}?tab=tasks` : null;
    case 'project_note':
      return p.projectId ? `/projects/${p.projectId}?tab=notes` : null;
    case 'project_created':
    case 'project_status':
      return p.projectId ? `/projects/${p.projectId}` : '/projects';
    case 'direct_message':
      return null; // opens thread view
    default:
      return null;
  }
}

/* ── Single notification card ── */
function NotificationCard({
  notification,
  onMarkRead,
  onNavigate,
  onOpenThread,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate: (route: string | null, id: string) => void;
  onOpenThread: (actorId: string, actorName: string, teamId: string) => void;
}) {
  const meta = EVENT_META[notification.event_type];
  const { Icon, colour } = meta;
  const description = buildDescription(notification);
  const route = getRoute(notification);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = () => {
    if (!notification.is_read) onMarkRead(notification.id);

    if (notification.event_type === 'direct_message') {
      const p = notification.payload as Record<string, string>;
      const actorName = p.actorName || 'Team Member';
      const teamId = p.teamId || '';
      onOpenThread(notification.actor_id, actorName, teamId);
    } else {
      onNavigate(route, notification.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors relative',
        'hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
      )}

      {/* Event icon */}
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted',
          colour
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug break-words">{description}</p>
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo}</p>
      </div>

      {/* Thread indicator for messages */}
      {notification.event_type === 'direct_message' && (
        <span className="mt-1 flex-shrink-0 text-xs text-primary font-medium">View →</span>
      )}
    </button>
  );
}

/* ── Panel ── */
interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [view, setView] = useState<'notifications' | 'thread'>('notifications');
  const [threadActor, setThreadActor] = useState<{ id: string; name: string; teamId: string } | null>(null);

  const handleNavigate = (route: string | null, _id: string) => {
    if (route) {
      onOpenChange(false);
      navigate(route);
    }
  };

  const handleOpenThread = (actorId: string, actorName: string, teamId: string) => {
    setThreadActor({ id: actorId, name: actorName, teamId });
    setView('thread');
  };

  const handleBack = () => {
    setView('notifications');
    setThreadActor(null);
  };

  // Reset view when panel closes
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setView('notifications');
      setThreadActor(null);
    }
    onOpenChange(v);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="left" className="w-96 p-0 flex flex-col">
        {view === 'thread' && threadActor ? (
          <MessageThreadPanel
            pmId={threadActor.id}
            pmName={threadActor.name}
            teamId={threadActor.teamId}
            onBack={handleBack}
          />
        ) : (
          <>
            <SheetHeader className="px-4 py-4 border-b border-border flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <SheetTitle className="text-base">Notifications</SheetTitle>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground h-7 px-2"
                  onClick={markAllRead}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
            </SheetHeader>

            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                  <Bell className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No activity yet. When your team takes action, you'll see it here.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <NotificationCard
                      key={n.id}
                      notification={n}
                      onMarkRead={markRead}
                      onNavigate={handleNavigate}
                      onOpenThread={handleOpenThread}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

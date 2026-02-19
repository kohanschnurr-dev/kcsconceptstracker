import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bell, ShoppingCart, Receipt, ClipboardList, CheckSquare, StickyNote, FolderPlus, RefreshCw, MessageCircle, ChevronDown } from 'lucide-react';
import { triggerSettingsSync } from '@/hooks/useSettingsSync';

const STORAGE_KEY = 'notification-preferences';

interface NotifPrefs {
  order_request: boolean;
  expense: boolean;
  daily_log: boolean;
  task_completed: boolean;
  project_note: boolean;
  project_created: boolean;
  project_status: boolean;
  direct_message: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  order_request: true,
  expense: true,
  daily_log: true,
  task_completed: true,
  project_note: true,
  project_created: true,
  project_status: true,
  direct_message: true,
};

const EVENT_META: {
  key: keyof NotifPrefs;
  label: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}[] = [
  { key: 'order_request', label: 'Order Requests', description: 'When a PM submits a procurement order', icon: ShoppingCart, iconClass: 'text-orange-500' },
  { key: 'expense', label: 'Expenses', description: 'When a new expense is logged', icon: Receipt, iconClass: 'text-red-500' },
  { key: 'daily_log', label: 'Daily Logs', description: 'When a daily site log is submitted', icon: ClipboardList, iconClass: 'text-blue-500' },
  { key: 'task_completed', label: 'Task Completions', description: 'When a task is marked complete', icon: CheckSquare, iconClass: 'text-green-500' },
  { key: 'project_note', label: 'Project Notes', description: 'When a note is added to a project', icon: StickyNote, iconClass: 'text-yellow-500' },
  { key: 'project_created', label: 'New Projects', description: 'When a new project is created', icon: FolderPlus, iconClass: 'text-purple-500' },
  { key: 'project_status', label: 'Status Changes', description: 'When a project status changes', icon: RefreshCw, iconClass: 'text-cyan-500' },
  { key: 'direct_message', label: 'Direct Messages', description: 'When a team member sends you a message', icon: MessageCircle, iconClass: 'text-primary' },
];

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

export default function NotificationPreferencesCard() {
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleSync = () => setPrefs(loadPrefs());
    window.addEventListener('settings-synced', handleSync);
    return () => window.removeEventListener('settings-synced', handleSync);
  }, []);

  const save = (next: NotifPrefs) => {
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    triggerSettingsSync();
  };

  const toggle = (key: keyof NotifPrefs) => {
    save({ ...prefs, [key]: !prefs[key] });
  };

  const turnAllOn = () => {
    const next = { ...DEFAULT_PREFS };
    Object.keys(next).forEach(k => (next[k as keyof NotifPrefs] = true));
    save(next);
  };

  const turnAllOff = () => {
    const next = { ...DEFAULT_PREFS };
    Object.keys(next).forEach(k => (next[k as keyof NotifPrefs] = false));
    save(next);
  };

  const allOn = Object.values(prefs).every(Boolean);
  const allOff = Object.values(prefs).every(v => !v);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg select-none">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
            <CardDescription>
              Choose which activity types appear in your notification bell. Turned-off types are silenced and won't count toward your unread badge.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">
                In-App Notifications
              </Label>
              <div className="space-y-1">
                {EVENT_META.map(({ key, label, description, icon: Icon, iconClass }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-muted ${iconClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={prefs[key]}
                      onCheckedChange={() => toggle(key)}
                      aria-label={`Toggle ${label} notifications`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={turnAllOn}
                disabled={allOn}
                className="text-xs"
              >
                Turn all on
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={turnAllOff}
                disabled={allOff}
                className="text-xs"
              >
                Turn all off
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}


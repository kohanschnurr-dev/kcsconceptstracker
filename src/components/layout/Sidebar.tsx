import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Receipt, 
  Users, 
  ClipboardList,
  Briefcase,
  LogOut,
  Calculator,
  ShoppingCart,
  CalendarDays,
  Settings,
  Bell,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Button } from '@/components/ui/button';
import kcsLogo from '@/assets/kcs-logo.png';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationsPanel } from './NotificationsPanel';

const isActiveLink = (item: { path: string; exact?: boolean; matchPaths?: string[] }, pathname: string) => {
  if (item.exact) {
    return pathname === item.path;
  }
  if (item.matchPaths) {
    return item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  }
  return pathname === item.path || pathname.startsWith(item.path + '/');
};

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { displayName } = useProfile();
  const { companyName, logoUrl } = useCompanySettings();
  const { unreadCount, isOwner } = useNotifications();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', exact: true },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
    { icon: Receipt, label: 'Expenses', path: '/expenses' },
    { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
    { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
    { icon: ShoppingCart, label: 'Procurement', path: '/procurement', matchPaths: ['/procurement', '/bundles'] },
    { icon: Users, label: 'Contractors', path: '/vendors' },
    { icon: Briefcase, label: companyName, path: '/business-expenses' },
  ];

  return (
    <>
      <aside 
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-3">
            <img 
              src={logoUrl || kcsLogo} 
              alt={companyName} 
              className="h-10 w-10 object-contain flex-shrink-0" 
            />
            <h1 className={cn(
              "font-bold text-foreground text-lg whitespace-nowrap transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0"
            )}>{companyName}</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => {
              const isActive = isActiveLink(item, location.pathname);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "whitespace-nowrap transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0"
                  )}>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border space-y-2 p-2">
            {user && (
              <div className={cn(
                "px-3 py-1 transition-all duration-300",
                isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden py-0"
              )}>
                <span className="text-xs text-muted-foreground truncate block">{displayName || user.email}</span>
              </div>
            )}
            <NavLink
              to="/settings"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-colors',
                location.pathname === '/settings'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={!isExpanded ? "Settings" : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0"
              )}>Settings</span>
            </NavLink>

            {/* Bell / Notifications — owners only */}
            {isOwner && (
              <button
                onClick={() => setNotifOpen(true)}
                title={!isExpanded ? "Notifications" : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-colors',
                  notifOpen
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="relative flex-shrink-0">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-0.5 leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className={cn(
                  'flex flex-1 items-center justify-between whitespace-nowrap transition-opacity duration-300',
                  isExpanded ? 'opacity-100' : 'opacity-0'
                )}>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold px-1.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </button>
            )}

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground"
              onClick={signOut}
              title={!isExpanded ? "Sign Out" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0"
              )}>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </>
  );
}

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
  Settings
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Button } from '@/components/ui/button';
import kcsLogo from '@/assets/kcs-logo.png';

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
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { displayName } = useProfile();
  const { companyName, logoUrl } = useCompanySettings();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', exact: true },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
    { icon: Receipt, label: 'Expenses', path: '/expenses' },
    { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
    { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
    { icon: ShoppingCart, label: 'Procurement', path: '/procurement', matchPaths: ['/procurement', '/bundles'] },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: Briefcase, label: companyName, path: '/business-expenses' },
  ];

  return (
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
              "flex items-center justify-between px-3 py-2 transition-all duration-300",
              isExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden py-0"
            )}>
              <span className="text-xs text-muted-foreground truncate whitespace-nowrap">{displayName || user.email}</span>
              <NavLink
                to="/settings"
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  location.pathname === '/settings'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Settings className="h-4 w-4" />
              </NavLink>
            </div>
          )}
          {!isExpanded && user && (
            <NavLink
              to="/settings"
              className={cn(
                'flex justify-center p-2.5 rounded-lg transition-colors',
                location.pathname === '/settings'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </NavLink>
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
  );
}

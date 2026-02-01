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
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { displayName } = useProfile();
  const { companyName, logoUrl } = useCompanySettings();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', exact: true },
    { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
    { icon: Receipt, label: 'Expenses', path: '/expenses' },
    { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
    { icon: ShoppingCart, label: 'Procurement', path: '/procurement', matchPaths: ['/procurement', '/bundles'] },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: Briefcase, label: companyName, path: '/business-expenses' },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <img 
            src={logoUrl || kcsLogo} 
            alt={companyName} 
            className="h-10 w-10 object-contain" 
          />
          <h1 className="font-bold text-foreground text-lg truncate">{companyName}</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
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
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4 space-y-2">
          {user && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-muted-foreground truncate">{displayName || user.email}</span>
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
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
}

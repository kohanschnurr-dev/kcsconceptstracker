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
  CalendarDays
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import kcsLogo from '@/assets/kcs-logo.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', exact: true },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: Briefcase, label: 'KCS Concepts', path: '/business-expenses' },
  { icon: Users, label: 'Vendors', path: '/vendors' },
  { icon: ShoppingCart, label: 'Procurement', path: '/procurement', matchPaths: ['/procurement', '/bundles'] },
  { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
  { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
];

const isActiveLink = (item: typeof navItems[0], pathname: string) => {
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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <img src={kcsLogo} alt="KCS Concepts" className="h-10 w-10 object-contain" />
          <h1 className="font-bold text-foreground text-lg">KCS Concepts</h1>
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
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              {user.email}
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

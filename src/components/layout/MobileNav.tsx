import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Receipt, 
  Users, 
  ClipboardList,
  Menu,
  LogOut,
  ShoppingCart,
  Briefcase,
  Calculator
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import kcsLogo from '@/assets/kcs-logo.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: Receipt, label: 'Expenses', path: '/expenses' },
  { icon: ShoppingCart, label: 'Procurement', path: '/procurement' },
  { icon: Briefcase, label: 'KCS Concepts', path: '/business-expenses' },
  { icon: Users, label: 'Vendors', path: '/vendors' },
  { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
  { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    setOpen(false);
    signOut();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4">
      <div className="flex items-center gap-2">
        <img src={kcsLogo} alt="KCS Concepts" className="h-9 w-9 object-contain" />
        <span className="font-bold text-lg">KCS Concepts</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 bg-sidebar p-0">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="font-semibold">Menu</span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
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
          
          <div className="border-t border-border p-4 space-y-2">
            {user && (
              <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

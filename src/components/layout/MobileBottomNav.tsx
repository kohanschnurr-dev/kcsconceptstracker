import { LayoutDashboard, Plus, Receipt, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onAddClick: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Receipt, label: 'History', path: '/expenses' },
  { icon: Settings, label: 'Settings', path: '/vendors' },
];

export function MobileBottomNav({ onAddClick }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Dashboard */}
        <NavLink
          to="/"
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            location.pathname === '/' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </NavLink>

        {/* History */}
        <NavLink
          to="/expenses"
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            location.pathname === '/expenses' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px] font-medium">History</span>
        </NavLink>

        {/* Add Button - Center */}
        <button
          onClick={onAddClick}
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
            <Plus className="h-7 w-7" />
          </div>
          <span className="text-[10px] font-medium text-primary mt-1">Add</span>
        </button>

        {/* Projects */}
        <NavLink
          to="/projects"
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            location.pathname.startsWith('/projects') 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Receipt className="h-5 w-5" />
          <span className="text-[10px] font-medium">Projects</span>
        </NavLink>

        {/* Vendors/Settings */}
        <NavLink
          to="/vendors"
          className={cn(
            'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
            location.pathname === '/vendors' 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium">Vendors</span>
        </NavLink>
      </div>
    </nav>
  );
}

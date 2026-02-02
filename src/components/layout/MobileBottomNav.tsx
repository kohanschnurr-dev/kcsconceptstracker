import { useState } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Receipt, 
  FolderKanban,
  CalendarDays,
  MoreHorizontal,
  ClipboardList,
  Calculator,
  ShoppingCart,
  Users,
  Briefcase,
  X
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useCompanySettings } from '@/hooks/useCompanySettings';

interface MobileBottomNavProps {
  onAddClick: () => void;
}

export function MobileBottomNav({ onAddClick }: MobileBottomNavProps) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { companyName } = useCompanySettings();

  // Items that appear in the "More" sheet
  const moreItems = [
    { icon: ClipboardList, label: 'Daily Logs', path: '/logs' },
    { icon: Calculator, label: 'Budget Calculator', path: '/calculator' },
    { icon: ShoppingCart, label: 'Procurement', path: '/procurement' },
    { icon: Users, label: 'Vendors', path: '/vendors' },
    { icon: Briefcase, label: companyName || 'Business', path: '/business-expenses' },
  ];

  // Check if any "more" item is active
  const isMoreActive = moreItems.some(item => 
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {/* Dashboard */}
          <NavLink
            to="/"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0',
              location.pathname === '/' 
                ? 'text-primary' 
                : 'text-muted-foreground active:text-foreground'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate">Home</span>
          </NavLink>

          {/* Projects */}
          <NavLink
            to="/projects"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0',
              location.pathname.startsWith('/projects') 
                ? 'text-primary' 
                : 'text-muted-foreground active:text-foreground'
            )}
          >
            <FolderKanban className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate">Projects</span>
          </NavLink>

          {/* Add Button - Center */}
          <button
            onClick={onAddClick}
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
          </button>

          {/* Calendar */}
          <NavLink
            to="/calendar"
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0',
              location.pathname === '/calendar' 
                ? 'text-primary' 
                : 'text-muted-foreground active:text-foreground'
            )}
          >
            <CalendarDays className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate">Calendar</span>
          </NavLink>

          {/* More Menu */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0',
                  isMoreActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground active:text-foreground'
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] font-medium truncate">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe">
              <SheetTitle className="sr-only">More Navigation Options</SheetTitle>
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              
              {/* Quick Access Grid */}
              <div className="grid grid-cols-4 gap-2 px-4 pb-4">
                {/* Expenses - featured item */}
                <NavLink
                  to="/expenses"
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors',
                    location.pathname === '/expenses'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/50 text-muted-foreground active:bg-muted'
                  )}
                >
                  <Receipt className="h-6 w-6" />
                  <span className="text-xs font-medium">Expenses</span>
                </NavLink>

                {moreItems.slice(0, 3).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/50 text-muted-foreground active:bg-muted'
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              {/* Additional Items List */}
              <div className="border-t border-border px-4 pt-3 pb-4 space-y-1">
                {moreItems.slice(3).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground active:bg-muted'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      {/* Spacer for fixed bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useSettingsSync } from '@/hooks/useSettingsSync';
import type { Project, CategoryBudget } from '@/types';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  useSettingsSync();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const { data: categoriesData } = await supabase
        .from('project_categories')
        .select('*');

      if (projectsData) {
        const transformed: Project[] = projectsData.map((p) => ({
          id: p.id,
          name: p.name,
          address: p.address,
          totalBudget: p.total_budget,
          startDate: p.start_date,
          status: p.status === 'on_hold' ? 'on-hold' : p.status as 'active' | 'complete',
          projectType: p.project_type as 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling',
          categories: (categoriesData || [])
            .filter((c: any) => c.project_id === p.id)
            .map((c: any) => ({
              id: c.id,
              projectId: c.project_id,
              category: c.category as CategoryBudget['category'],
              estimatedBudget: c.estimated_budget,
              actualSpent: 0,
            })),
        }));
        setProjects(transformed);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Top Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main Content */}
      <main className="lg:ml-16">
        <div className="min-h-screen p-4 pt-20 pb-24 lg:p-8 lg:pt-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden">
        <MobileBottomNav onAddClick={() => setExpenseModalOpen(true)} />
      </div>

      {/* Quick Add Expense Modal */}
      <QuickExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        projects={projects}
        onExpenseCreated={() => window.location.reload()}
      />
    </div>
  );
}

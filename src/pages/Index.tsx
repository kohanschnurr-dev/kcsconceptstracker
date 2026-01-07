import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  FolderKanban, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Calendar
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { BudgetBreakdown } from '@/components/dashboard/BudgetBreakdown';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { VendorComplianceTable } from '@/components/dashboard/VendorComplianceTable';
import { QuickActionButton } from '@/components/QuickActionButton';
import { QuickExpenseModal } from '@/components/QuickExpenseModal';
import { mockProjects, mockExpenses, mockVendors } from '@/data/mockData';

export default function Index() {
  const navigate = useNavigate();
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(mockProjects[0]?.id || null);

  // Calculate stats
  const activeProjects = mockProjects.filter(p => p.status === 'active');
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.totalBudget, 0);
  const totalSpent = mockProjects.reduce((sum, p) => 
    sum + p.categories.reduce((catSum, cat) => catSum + cat.actualSpent, 0), 0
  );
  const overbudgetCount = mockProjects.reduce((count, p) => 
    count + p.categories.filter(cat => cat.actualSpent > cat.estimatedBudget * 1.05).length, 0
  );
  const vendorsNeedingAttention = mockVendors.filter(v => 
    !v.hasW9 || new Date(v.insuranceExpiry) < new Date()
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedProject = mockProjects.find(p => p.id === selectedProjectId);
  const projectExpenses = mockExpenses.filter(e => e.projectId === selectedProjectId);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">DFW Fix & Flip Budget Tracker</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Projects"
            value={activeProjects.length.toString()}
            subtitle={`${mockProjects.length} total`}
            icon={FolderKanban}
            variant="default"
          />
          <StatCard
            title="Total Budget"
            value={formatCurrency(totalBudget)}
            subtitle={`${formatCurrency(totalSpent)} spent`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Over Budget"
            value={overbudgetCount.toString()}
            subtitle="Categories flagged"
            icon={AlertTriangle}
            variant={overbudgetCount > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title="Vendor Alerts"
            value={vendorsNeedingAttention.toString()}
            subtitle="Need attention"
            icon={Users}
            variant={vendorsNeedingAttention > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Active Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Detail Section */}
        {selectedProject && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetBreakdown project={selectedProject} />
            <RecentExpenses 
              expenses={projectExpenses} 
              projectCategories={selectedProject.categories}
            />
          </div>
        )}

        {/* Vendor Compliance */}
        <VendorComplianceTable vendors={mockVendors} />
      </div>

      {/* Quick Action FAB */}
      <QuickActionButton onClick={() => setExpenseModalOpen(true)} />

      {/* Quick Expense Modal */}
      <QuickExpenseModal
        open={expenseModalOpen}
        onOpenChange={setExpenseModalOpen}
        projects={mockProjects}
      />
    </MainLayout>
  );
}

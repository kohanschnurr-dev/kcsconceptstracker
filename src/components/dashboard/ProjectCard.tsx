import { MapPin, Calendar, Home, Hammer, Building2 } from 'lucide-react';
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const totalSpent = project.categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const isRental = project.projectType === 'rental';
  const isNewConstruction = project.projectType === 'new_construction';
  const showBudgetProgress = !isRental; // Show budget for fix_flip and new_construction
  
  // Calculate budget metrics for fix & flips and new construction
  const percentSpent = showBudgetProgress ? (totalSpent / project.totalBudget) * 100 : 0;
  const remaining = showBudgetProgress ? project.totalBudget - totalSpent : 0;


  const getProgressColor = () => {
    if (percentSpent > 100) return 'bg-destructive';
    if (percentSpent > 90) return 'bg-warning';
    return 'bg-success';
  };

  const getCoverPhotoUrl = () => {
    if (!project.coverPhotoPath) return null;
    const { data } = supabase.storage
      .from('project-photos')
      .getPublicUrl(project.coverPhotoPath);
    return data.publicUrl;
  };

  const coverPhotoUrl = getCoverPhotoUrl();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return formatDisplayDate(date);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 animate-slide-up overflow-hidden",
        !coverPhotoUrl && "p-5"
      )}
    >
      {/* Cover Photo */}
      {coverPhotoUrl && (
        <div className="h-32 w-full overflow-hidden">
          <img 
            src={coverPhotoUrl} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className={cn("space-y-4", coverPhotoUrl && "p-5")}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isNewConstruction ? (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            ) : isRental ? (
              <Home className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Hammer className="h-4 w-4 text-muted-foreground" />
            )}
            <h3 className="font-semibold text-lg">{project.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{project.address}</span>
          </div>
        </div>
        <Badge
          variant={project.status === 'complete' ? 'default' : 'secondary'}
          className={cn(
            project.status === 'active' && 'bg-success/20 text-success border-success/30',
            project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
            project.status === 'on-hold' && 'bg-warning/20 text-warning border-warning/30'
          )}
        >
          {project.status}
        </Badge>
      </div>

      {/* Budget Progress - For Fix & Flips and New Construction */}
      {showBudgetProgress && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget Progress</span>
            <span className="font-mono font-medium">{percentSpent.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={cn('progress-fill', getProgressColor())}
              style={{ width: `${Math.min(percentSpent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(totalSpent)} spent</span>
            <span>{formatCurrency(project.totalBudget)} total</span>
          </div>
        </div>
      )}

      {/* Rental - Show total expenses */}
      {isRental && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="font-mono font-semibold text-lg">{formatCurrency(totalSpent)}</p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        {showBudgetProgress ? (
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={cn(
              'font-mono font-semibold',
              remaining < 0 ? 'text-destructive' : 'text-success'
            )}>
              {formatCurrency(remaining)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="text-sm font-medium">Rental Property</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Start Date</p>
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatDate(project.startDate)}</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

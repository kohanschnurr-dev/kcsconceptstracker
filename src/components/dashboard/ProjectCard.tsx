import { useState, useRef, useEffect } from 'react';
import { MapPin, Calendar, Home, Hammer, Building2, Handshake, MoreVertical, Pencil, CheckCircle, PauseCircle, Play, Trash2 } from 'lucide-react';
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDisplayDate } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  onProjectUpdated?: () => void;
}

export function ProjectCard({ project, onClick, onProjectUpdated }: ProjectCardProps) {
  const [editingName, setEditingName] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);
  const [addressValue, setAddressValue] = useState(project.address);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingName) nameInputRef.current?.focus(); }, [editingName]);
  useEffect(() => { if (editingAddress) addressInputRef.current?.focus(); }, [editingAddress]);

  const totalSpent = project.categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const isRental = project.projectType === 'rental';
  const isNewConstruction = project.projectType === 'new_construction';
  const isWholesaling = project.projectType === 'wholesaling';
  const showBudgetProgress = !isRental;
  const percentSpent = showBudgetProgress ? (totalSpent / project.totalBudget) * 100 : 0;
  const remaining = showBudgetProgress ? project.totalBudget - totalSpent : 0;

  const getProgressColor = () => {
    if (percentSpent > 100) return 'bg-primary';
    if (percentSpent > 90) return 'bg-warning';
    return 'bg-success';
  };

  const getCoverPhotoUrl = () => {
    if (!project.coverPhotoPath) return null;
    const { data } = supabase.storage.from('project-photos').getPublicUrl(project.coverPhotoPath);
    return data.publicUrl;
  };

  const coverPhotoUrl = getCoverPhotoUrl();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) => formatDisplayDate(date);

  const saveField = async (field: 'name' | 'address', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast({ title: `${field === 'name' ? 'Name' : 'Address'} cannot be empty`, variant: 'destructive' });
      if (field === 'name') { setNameValue(project.name); setEditingName(false); }
      else { setAddressValue(project.address); setEditingAddress(false); }
      return;
    }
    const { error } = await supabase.from('projects').update({ [field]: trimmed }).eq('id', project.id);
    if (error) {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${field === 'name' ? 'Name' : 'Address'} updated` });
      onProjectUpdated?.();
    }
    if (field === 'name') setEditingName(false);
    else setEditingAddress(false);
  };

  const updateStatus = async (status: 'active' | 'complete' | 'on_hold') => {
    const { error } = await supabase.from('projects').update({ status }).eq('id', project.id);
    if (error) toast({ title: 'Failed to update status', variant: 'destructive' });
    else { toast({ title: `Status changed to ${status.replace('_', ' ')}` }); onProjectUpdated?.(); }
  };

  const deleteProject = async () => {
    const { error } = await supabase.from('projects').delete().eq('id', project.id);
    if (error) toast({ title: 'Failed to delete project', variant: 'destructive' });
    else { toast({ title: 'Project deleted' }); onProjectUpdated?.(); }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 animate-slide-up overflow-hidden relative",
        !coverPhotoUrl && "p-5"
      )}
    >
      {/* Cover Photo */}
      {coverPhotoUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={coverPhotoUrl} 
            alt={project.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: project.coverPhotoPosition || '50% 50%' }}
          />
        </div>
      )}
      
      <div className={cn("space-y-4", coverPhotoUrl && "p-5")}>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isNewConstruction ? (
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : isRental ? (
                <Home className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : isWholesaling ? (
                <Handshake className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <Hammer className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              {editingName ? (
                <Input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => saveField('name', nameValue)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') saveField('name', nameValue);
                    if (e.key === 'Escape') { setNameValue(project.name); setEditingName(false); }
                  }}
                  className="h-7 text-lg font-semibold py-0"
                />
              ) : (
                <h3 className="font-semibold text-lg truncate">{project.name}</h3>
              )}
            </div>
            {editingAddress ? (
              <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                  ref={addressInputRef}
                  value={addressValue}
                  onChange={(e) => setAddressValue(e.target.value)}
                  onBlur={() => saveField('address', addressValue)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') saveField('address', addressValue);
                    if (e.key === 'Escape') { setAddressValue(project.address); setEditingAddress(false); }
                  }}
                  className="h-6 text-sm py-0"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{project.address}</span>
              </div>
            )}
          </div>
          <Badge
            variant={project.status === 'complete' ? 'default' : 'secondary'}
            className={cn(
              'shrink-0',
              project.status === 'active' && 'bg-success/20 text-success border-success/30',
              project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
              project.status === 'on-hold' && 'bg-warning/20 text-warning border-warning/30'
            )}
          >
            {project.status}
          </Badge>
        </div>

        {/* Budget Progress */}
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

        {/* Rental expenses */}
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
              <p className={cn('font-mono font-semibold', remaining < 0 ? 'text-destructive' : 'text-success')}>
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

      {/* 3-dot menu */}
      <div className="absolute bottom-3 right-3" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => { setNameValue(project.name); setEditingName(true); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Name
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAddressValue(project.address); setEditingAddress(true); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Address
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => updateStatus('active')}>
                  <Play className="h-4 w-4 mr-2" /> Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateStatus('on_hold')}>
                  <PauseCircle className="h-4 w-4 mr-2" /> On Hold
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateStatus('complete')}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Complete
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={deleteProject}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

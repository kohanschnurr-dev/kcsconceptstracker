import { useState, useEffect } from 'react';
import { Building2, MapPin, DollarSign, Calendar as CalendarIcon, Hammer, Handshake, HardHat, CopyCheck } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { getBudgetCategories, type ProjectType } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDateString } from '@/lib/dateUtils';

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
  defaultProjectType?: ProjectType;
}

export function NewProjectModal({ open, onOpenChange, onProjectCreated, defaultProjectType = 'fix_flip' }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [projectType, setProjectType] = useState<ProjectType>(defaultProjectType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update project type when defaultProjectType changes
  useEffect(() => {
    setProjectType(defaultProjectType);
  }, [defaultProjectType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !address || !totalBudget) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a project.',
          variant: 'destructive',
        });
        return;
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name,
          address,
          total_budget: parseFloat(totalBudget),
          start_date: formatDateString(startDate),
          user_id: user.id,
          status: 'active',
          project_type: projectType,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create default budget categories
      const allCats = getBudgetCategories();
      const budgetPerCategory = parseFloat(totalBudget) / allCats.length;
      const categories = allCats.map(cat => ({
        project_id: project.id,
        category: cat.value,
        estimated_budget: Math.round(budgetPerCategory),
      }));

      const { error: categoriesError } = await supabase
        .from('project_categories')
        .insert(categories);

      if (categoriesError) throw categoriesError;

      toast({
        title: 'Project created!',
        description: `${name} has been added to your projects.`,
      });

      // Reset form
      setName('');
      setAddress('');
      setTotalBudget('');
      setStartDate(new Date());
      setProjectType(defaultProjectType);
      onOpenChange(false);
      onProjectCreated?.();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            New Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Type Selection */}
          <div className="space-y-2">
            <Label>Project Type</Label>
            <Tabs value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="fix_flip" className="gap-1 text-xs">
                  <Hammer className="h-4 w-4" />
                  <span className="hidden sm:inline">Fix & Flip</span>
                </TabsTrigger>
                <TabsTrigger value="rental" className="gap-1 text-xs">
                  <span className="hidden sm:inline">Rental</span>
                </TabsTrigger>
                <TabsTrigger value="new_construction" className="gap-1 text-xs">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">New Build</span>
                </TabsTrigger>
                <TabsTrigger value="wholesaling" className="gap-1 text-xs">
                  <Handshake className="h-4 w-4" />
                  <span className="hidden sm:inline">Wholesale</span>
                </TabsTrigger>
                <TabsTrigger value="contractor" className="gap-1 text-xs">
                  <HardHat className="h-4 w-4" />
                  <span className="hidden sm:inline">Contractor</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label>Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="1234 Main St, Dallas, TX 75208"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Project Name *</Label>
              {address && (
                <button
                  type="button"
                  onClick={() => setName(address)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <CopyCheck className="h-3 w-3" />
                  Use Address
                </button>
              )}
            </div>
            <Input
              placeholder={
                projectType === 'new_construction' 
                  ? "Lot 45 Custom Home, Lakeside Estates..." 
                  : projectType === 'fix_flip' 
                    ? "Oak Cliff Flip, Downtown Bungalow..." 
                    : projectType === 'wholesaling'
                      ? "123 Main St Contract, Quick Assignment..."
                      : projectType === 'contractor'
                        ? "Smith Kitchen Remodel, Commercial TI..."
                        : "Rental Property 1, Main St Duplex..."
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Budget *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="1000"
                  placeholder="85000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="pl-9 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      "w-full pl-9 justify-start text-left font-normal relative",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {startDate ? format(startDate, "MM/dd/yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            Budget will be automatically distributed across {getBudgetCategories().length} categories. You can adjust individual amounts later.
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

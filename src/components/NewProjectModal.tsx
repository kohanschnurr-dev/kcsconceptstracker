import { useState, useEffect } from 'react';
import { Building2, MapPin, DollarSign, Calendar, Hammer, Home, HardHat } from 'lucide-react';
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
import { BUDGET_CATEGORIES, type ProjectType } from '@/types';
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
  const [startDate, setStartDate] = useState(formatDateString(new Date()));
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
          start_date: startDate,
          user_id: user.id,
          status: 'active',
          project_type: projectType,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create default budget categories
      const budgetPerCategory = parseFloat(totalBudget) / BUDGET_CATEGORIES.length;
      const categories = BUDGET_CATEGORIES.map(cat => ({
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
      setStartDate(formatDateString(new Date()));
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fix_flip" className="gap-2">
                  <Hammer className="h-4 w-4" />
                  Fix & Flip
                </TabsTrigger>
                <TabsTrigger value="rental" className="gap-2">
                  <Home className="h-4 w-4" />
                  Rental
                </TabsTrigger>
                <TabsTrigger value="new_construction" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  New Build
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input
              placeholder={
                projectType === 'new_construction' 
                  ? "Lot 45 Custom Home, Lakeside Estates..." 
                  : projectType === 'fix_flip' 
                    ? "Oak Cliff Flip, Downtown Bungalow..." 
                    : "Rental Property 1, Main St Duplex..."
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            Budget will be automatically distributed across {BUDGET_CATEGORIES.length} categories. You can adjust individual amounts later.
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

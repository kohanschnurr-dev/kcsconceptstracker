import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, DollarSign, Calendar as CalendarIcon, Hammer, CopyCheck, Calculator, Home, HardHat } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getBudgetCategories, type ProjectType } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDateString } from '@/lib/dateUtils';

interface BudgetTemplate {
  id: string;
  name: string;
  total_budget: number | null;
  category_budgets: any;
}

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
  defaultProjectType?: ProjectType;
}

export function NewProjectModal({ open, onOpenChange, onProjectCreated, defaultProjectType = 'fix_flip' }: NewProjectModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [projectType, setProjectType] = useState<ProjectType>(defaultProjectType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedBudgets, setSavedBudgets] = useState<BudgetTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null);

  // Update project type when defaultProjectType changes
  useEffect(() => {
    setProjectType(defaultProjectType);
  }, [defaultProjectType]);

  // Fetch saved budgets when modal opens
  useEffect(() => {
    if (!open) return;
    const fetchBudgets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('budget_templates')
        .select('id, name, total_budget, category_budgets')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setSavedBudgets(data || []);
    };
    fetchBudgets();
  }, [open]);

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'none') {
      setSelectedTemplate(null);
      return;
    }
    const template = savedBudgets.find(b => b.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      if (template.total_budget) {
        setTotalBudget(String(template.total_budget));
      }
    }
  };

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

      // Register all categories in the enum (handles custom ones)
      const allCats = getBudgetCategories();
      
      // Also register any categories from the selected template
      const templateKeys = selectedTemplate?.category_budgets
        ? Object.keys(selectedTemplate.category_budgets as Record<string, unknown>).filter(k => k !== '_meta')
        : [];
      const allValues = new Set([...allCats.map(c => c.value), ...templateKeys]);
      
      for (const val of allValues) {
        await supabase.rpc('add_budget_category', { new_value: val });
      }

      // Create default budget categories (all at $0)
      const categories = allCats.map(cat => ({
        project_id: project.id,
        category: cat.value,
        estimated_budget: 0,
      }));

      const { error: categoriesError } = await supabase
        .from('project_categories')
        .insert(categories);

      if (categoriesError) throw categoriesError;

      // If a saved budget template was selected, stage it as pending_budget
      if (selectedTemplate) {
        const { error: pendingError } = await supabase
          .from('projects')
          .update({
            pending_budget: selectedTemplate.category_budgets,
            total_budget: parseFloat(totalBudget),
          })
          .eq('id', project.id);

        if (pendingError) throw pendingError;
      }

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
      setSelectedTemplate(null);
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
                <TabsTrigger value="fix_flip" className="gap-1 text-xs">
                  <Hammer className="h-3.5 w-3.5" />
                  Fix & Flip
                </TabsTrigger>
                <TabsTrigger value="new_construction" className="gap-1 text-xs">
                  <HardHat className="h-3.5 w-3.5" />
                  New Build
                </TabsTrigger>
                <TabsTrigger value="rental" className="gap-1 text-xs">
                  <Home className="h-3.5 w-3.5" />
                  Rental
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
              placeholder="Enter project name..."
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

          {/* Saved Budget Picker */}
          <div className="space-y-2">
            <Label>Apply Saved Budget (optional)</Label>
            <Select
              value={selectedTemplate?.id || 'none'}
              onValueChange={handleTemplateSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="None — categories start at $0" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None — categories start at $0</SelectItem>
                {savedBudgets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} {b.total_budget ? `($${b.total_budget.toLocaleString()})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate('/budget-calculator');
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Calculator className="h-3 w-3" />
              or build one in Budget Calculator
            </button>
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

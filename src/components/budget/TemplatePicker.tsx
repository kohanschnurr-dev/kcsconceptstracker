import { useState, useEffect } from 'react';
import { FileText, ChevronDown, Sparkles, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { BUDGET_CATEGORIES } from '@/types';

interface BudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  purchase_price: number;
  arv: number;
  category_budgets: Record<string, number>;
  total_budget: number;
}

interface TemplatePickerProps {
  onSelectTemplate: (template: BudgetTemplate | null) => void;
  onCreateNew: () => void;
  currentTemplateName?: string;
}

// Preset templates for common rehab scenarios
const PRESET_TEMPLATES: Omit<BudgetTemplate, 'id'>[] = [
  {
    name: 'Cosmetic Refresh',
    description: 'Light cosmetic updates - paint, flooring, fixtures',
    purchase_price: 0,
    arv: 0,
    total_budget: 25000,
    category_budgets: {
      painting: 5000,
      flooring: 8000,
      light_fixtures: 2000,
      hardware: 1500,
      landscaping: 3000,
      cleaning_final_punch: 1500,
      dumpsters_trash: 1000,
      misc: 3000,
    },
  },
  {
    name: 'Standard Rental Refresh',
    description: 'Rental-ready with kitchen/bath updates',
    purchase_price: 0,
    arv: 0,
    total_budget: 45000,
    category_budgets: {
      painting: 6000,
      flooring: 10000,
      cabinets: 8000,
      countertops: 4000,
      appliances: 4000,
      bathroom: 5000,
      light_fixtures: 2500,
      hardware: 1500,
      landscaping: 2000,
      cleaning_final_punch: 2000,
    },
  },
  {
    name: 'Full Gut Flip',
    description: 'Complete renovation - structure to finishes',
    purchase_price: 0,
    arv: 0,
    total_budget: 120000,
    category_budgets: {
      demolition: 8000,
      framing: 10000,
      electrical: 12000,
      plumbing: 10000,
      hvac: 8000,
      drywall: 8000,
      painting: 8000,
      flooring: 15000,
      kitchen: 15000,
      bathroom: 10000,
      cabinets: 6000,
      countertops: 5000,
      appliances: 5000,
      permits_inspections: 3000,
      dumpsters_trash: 3000,
      cleaning_final_punch: 2000,
      landscaping: 4000,
    },
  },
];

export function TemplatePicker({ onSelectTemplate, onCreateNew, currentTemplateName }: TemplatePickerProps) {
  const [savedTemplates, setSavedTemplates] = useState<BudgetTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data, error } = await supabase
          .from('budget_templates')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setSavedTemplates((data as BudgetTemplate[]) || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          {currentTemplateName || 'Load Template'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Start Blank
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          Quick Start Templates
        </DropdownMenuLabel>
        {PRESET_TEMPLATES.map((template) => (
          <DropdownMenuItem 
            key={template.name}
            onClick={() => onSelectTemplate({ ...template, id: `preset-${template.name}` })}
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{template.name}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {formatCurrency(template.total_budget)}
                </span>
              </div>
              {template.description && (
                <span className="text-xs text-muted-foreground">{template.description}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}

        {savedTemplates.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <FolderOpen className="h-3 w-3" />
              Your Saved Budgets
            </DropdownMenuLabel>
            {savedTemplates.map((template) => {
              const total = Object.values(template.category_budgets).reduce((sum, val) => sum + (val || 0), 0);
              return (
                <DropdownMenuItem 
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium truncate">{template.name}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

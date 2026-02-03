import { useState, useEffect } from 'react';
import { FileText, ChevronDown, Ruler, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

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

// Baseline tiers for $/sqft budgeting
const BASELINE_TIERS = [
  { name: 'Cosmetic', pricePerSqft: 35, description: 'Light refresh - paint, fixtures' },
  { name: 'Standard', pricePerSqft: 45, description: 'Typical rental-ready updates' },
  { name: 'High Level', pricePerSqft: 55, description: 'Quality finishes and systems' },
  { name: 'Overhaul', pricePerSqft: 65, description: 'Major renovation work' },
];

export function TemplatePicker({ onSelectTemplate, onCreateNew, currentTemplateName }: TemplatePickerProps) {
  const [savedTemplates, setSavedTemplates] = useState<BudgetTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sqft, setSqft] = useState<string>('');

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

  const handleBaselineSelect = (tier: typeof BASELINE_TIERS[0]) => {
    const sqftNum = parseFloat(sqft) || 0;
    const totalBudget = sqftNum * tier.pricePerSqft;
    
    const template: BudgetTemplate = {
      id: `baseline-${tier.name.toLowerCase().replace(' ', '-')}`,
      name: `${tier.name} (${sqftNum.toLocaleString()} sqft)`,
      description: tier.description,
      purchase_price: 0,
      arv: 0,
      total_budget: totalBudget,
      category_budgets: {},
    };
    
    onSelectTemplate(template);
  };

  const sqftNum = parseFloat(sqft) || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          {currentTemplateName || 'Load Template'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuItem onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Start Blank
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="flex items-center gap-2">
          <Ruler className="h-3 w-3" />
          Baselines
        </DropdownMenuLabel>
        
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Sqft:</span>
            <Input
              type="number"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              placeholder="1500"
              className="h-7 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        
        {BASELINE_TIERS.map((tier) => {
          const calculatedTotal = sqftNum * tier.pricePerSqft;
          return (
            <DropdownMenuItem 
              key={tier.name}
              onClick={() => handleBaselineSelect(tier)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium">{tier.name}</span>
                  <span className="text-xs text-muted-foreground">{tier.description}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    ${tier.pricePerSqft}/sqft
                  </span>
                  {sqftNum > 0 && (
                    <span className="text-xs font-mono text-primary">
                      {formatCurrency(calculatedTotal)}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}

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

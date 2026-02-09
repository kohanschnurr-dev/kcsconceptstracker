import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Repeat } from 'lucide-react';
import { formatDisplayDate } from '@/lib/dateUtils';
import { getMonthlyCategoryLabel } from '@/lib/monthlyCategories';
import { cn } from '@/lib/utils';

interface MonthlyExpensesProps {
  projectId: string;
  formatCurrency: (amount: number) => string;
}

interface MonthlyExpense {
  id: string;
  amount: number;
  date: string;
  vendor_name: string | null;
  description: string | null;
  notes: string | null;
  category_id: string;
  project_categories: { category: string } | null;
}

export function MonthlyExpenses({ projectId, formatCurrency }: MonthlyExpensesProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: monthlyExpenses = [] } = useQuery({
    queryKey: ['monthly-expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, date, vendor_name, description, notes, category_id, project_categories(category)')
        .eq('project_id', projectId)
        .eq('expense_type', 'monthly')
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []) as MonthlyExpense[];
    },
  });

  const grouped = useMemo(() => {
    const map: Record<string, { label: string; total: number; items: MonthlyExpense[] }> = {};
    monthlyExpenses.forEach((exp) => {
      const catValue = exp.project_categories?.category || 'other';
      if (!map[catValue]) {
        map[catValue] = { label: getMonthlyCategoryLabel(catValue), total: 0, items: [] };
      }
      map[catValue].total += Number(exp.amount);
      map[catValue].items.push(exp);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [monthlyExpenses]);

  const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (monthlyExpenses.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Monthly Costs</CardTitle>
                <Badge variant="secondary" className="text-xs font-mono">
                  {monthlyExpenses.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm">{formatCurrency(totalMonthly)}</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            {/* Category pills - always visible */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {grouped.map((g) => (
                <Badge
                  key={g.label}
                  variant="outline"
                  className="text-xs font-normal gap-1 bg-muted/50"
                >
                  {g.label}
                  <span className="font-mono font-medium">{formatCurrency(g.total)}</span>
                </Badge>
              ))}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {grouped.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground">
                        {item.vendor_name || item.description || 'Payment'}
                      </span>
                      {item.notes && (
                        <span className="text-muted-foreground ml-2 text-xs">— {item.notes}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground">{formatDisplayDate(item.date)}</span>
                      <span className="font-mono text-sm">{formatCurrency(Number(item.amount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

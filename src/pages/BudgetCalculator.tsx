import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, RotateCcw, Upload, FileDown, History } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MAOGauge } from '@/components/budget/MAOGauge';
import { BudgetCanvas } from '@/components/budget/BudgetCanvas';
import { TemplatePicker } from '@/components/budget/TemplatePicker';
import { DealSidebar, type CalculatorType } from '@/components/budget/DealSidebar';
import { computeHoldingCosts, holdingCostLabel, type HoldingMode, type MonthlyRateMode } from '@/lib/holdingCosts';
import { RentalAnalysis } from '@/components/budget/RentalAnalysis';
import { BRRRAnalysis } from '@/components/budget/BRRRAnalysis';
import { ImportBudgetModal } from '@/components/budget/ImportBudgetModal';
import { CostHistoryPanel } from '@/components/budget/CostHistoryPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { RentalFieldValues } from '@/components/budget/RentalFields';
import { getBudgetCategories } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { generateBudgetPdf } from '@/lib/budgetPdfExport';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { CategorySplit } from '@/components/budget/BudgetCategoryCard';

const SPLIT_MODE_KEY = 'budget-split-mode';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface BudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  purchase_price: number;
  arv: number;
  sqft: number | null;
  is_default: boolean;
  category_budgets: Record<string, number>;
  total_budget: number;
}

const defaultRentalFields: RentalFieldValues = {
  monthlyRent: '',
  vacancyRate: '',
  annualTaxes: '',
  annualInsurance: '',
  annualHoa: '',
  monthlyMaintenance: '',
  managementRate: '',
  refiEnabled: true,
  refiLtv: '75',
  refiLoanAmount: '',
  refiPoints: '',
  refiPointsMode: 'pct' as const,
  refiRate: '',
  refiTerm: '',
  refiLtvBase: 'arv' as const,
  loanType: 'amortizing' as const,
};

export default function BudgetCalculator() {
  const { settings: companySettings } = useCompanySettings();
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [arv, setArv] = useState<string>('');
  const [budgetName, setBudgetName] = useState<string>('');
  const [budgetDescription, setBudgetDescription] = useState<string>('');
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');
  const [profitBreakdownOpen, setProfitBreakdownOpen] = useState(false);
  const [maoPercentage, setMaoPercentage] = useState<number>(78);
  const [includeSellClosingCosts, setIncludeSellClosingCosts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [sqft, setSqft] = useState<string>('');
  const [activeBaselineRate, setActiveBaselineRate] = useState<number | null>(null);
  const [templateJustApplied, setTemplateJustApplied] = useState(false);
  const [calculatorType, setCalculatorType] = useState<CalculatorType>(() => {
    try {
      const saved = localStorage.getItem('budget-calculator-tab-order');
      if (saved) {
        const order = JSON.parse(saved) as CalculatorType[];
        if (order.length > 0) return order[0];
      }
    } catch {}
    return 'fix_flip';
  });
  const [rentalFields, setRentalFields] = useState<RentalFieldValues>(defaultRentalFields);
  const [closingPct, setClosingPct] = useState<string>('2');
  const [holdingPct, setHoldingPct] = useState<string>('3');
  const [sellClosingPct, setSellClosingPct] = useState<string>('6');
  const [closingMode, setClosingMode] = useState<'pct' | 'flat'>('pct');
  const [holdingMode, setHoldingMode] = useState<HoldingMode>('pct');
  const [sellClosingMode, setSellClosingMode] = useState<'pct' | 'flat'>('pct');
  const [closingFlat, setClosingFlat] = useState<string>('');
  const [holdingFlat, setHoldingFlat] = useState<string>('');
  const [holdingMonthlyRate, setHoldingMonthlyRate] = useState<string>('');
  const [holdingMonthlyRateMode, setHoldingMonthlyRateMode] = useState<MonthlyRateMode>('dollar');
  const [holdingMonths, setHoldingMonths] = useState<string>('6');
  const [sellClosingFlat, setSellClosingFlat] = useState<string>('');
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);
  const [autoRevealCategory, setAutoRevealCategory] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [costHistoryOpen, setCostHistoryOpen] = useState(false);
  const [splitMode, setSplitMode] = useState<boolean>(() => {
    try { return localStorage.getItem(SPLIT_MODE_KEY) === 'true'; } catch { return false; }
  });
  const [categorySplits, setCategorySplits] = useState<Record<string, CategorySplit>>({});
  // Category budgets state
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    getBudgetCategories().forEach(cat => {
      initial[cat.value] = '';
    });
    return initial;
  });

  const handleRentalFieldChange = (field: keyof RentalFieldValues, value: string | boolean) => {
    setRentalFields(prev => {
      const next = { ...prev, [field]: value };
      return next;
    });
  };

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, address, project_type')
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('name');
        
        if (error) throw error;
        setProjects((data || []).map(p => ({ ...p, projectType: p.project_type })));
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Load default template on mount
  useEffect(() => {
    const loadDefaultTemplate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (data) {
        const template: BudgetTemplate = {
          id: data.id,
          name: data.name,
          description: data.description,
          purchase_price: data.purchase_price || 0,
          arv: data.arv || 0,
          sqft: data.sqft,
          is_default: data.is_default || false,
          category_budgets: (data.category_budgets as Record<string, number>) || {},
          total_budget: data.total_budget || 0,
        };
        
        setBudgetName(template.name);
        setBudgetDescription(template.description || '');
        setPurchasePrice(template.purchase_price?.toString() || '');
        setArv(template.arv?.toString() || '');
        setSqft(template.sqft?.toString() || '');
        setCurrentTemplateName(template.name);

        // Restore all deal parameters from meta
        const meta = (template.category_budgets as any)?._meta;
        if (meta?.type) {
          setCalculatorType(meta.type);
        }
        setClosingPct(meta?.closingPct ?? '2');
        setHoldingPct(meta?.holdingPct ?? '3');
        setSellClosingPct(meta?.sellClosingPct ?? '6');
        setClosingMode(meta?.closingMode ?? 'pct');
        setHoldingMode(meta?.holdingMode ?? 'pct');
        setSellClosingMode(meta?.sellClosingMode ?? 'pct');
        setClosingFlat(meta?.closingFlat ?? '');
        setHoldingFlat(meta?.holdingFlat ?? '');
        setHoldingMonthlyRate(meta?.holdingMonthlyRate ?? '');
        setHoldingMonthlyRateMode(meta?.holdingMonthlyRateMode ?? 'dollar');
        setHoldingMonths(meta?.holdingMonths ?? '6');
        setSellClosingFlat(meta?.sellClosingFlat ?? '');
        setIncludeSellClosingCosts(meta?.includeSellClosingCosts ?? true);
        if (meta?.rentalFields) {
          setRentalFields({ ...defaultRentalFields, ...meta.rentalFields });
        }
        const savedSplits: Record<string, CategorySplit> = meta?.splits ?? {};
        if (typeof meta?.splitMode === 'boolean') {
          setSplitMode(meta.splitMode);
          try { localStorage.setItem(SPLIT_MODE_KEY, String(meta.splitMode)); } catch {}
        }
        // contractor fields ignored (removed feature)

        const newBudgets: Record<string, string> = {};
        getBudgetCategories().forEach(cat => {
          newBudgets[cat.value] = template.category_budgets[cat.value]?.toString() || '';
        });
        setCategoryBudgets(newBudgets);
        setCategorySplits(seedMaterialSplits(savedSplits, newBudgets, typeof meta?.splitMode === 'boolean' ? meta.splitMode : splitMode));
      }
    };

    loadDefaultTemplate();
  }, []);

  // Calculate totals
  const totalBudget = Object.values(categoryBudgets).reduce((sum, val) => {
    return sum + (parseFloat(val) || 0);
  }, 0);

  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const arvNum = parseFloat(arv) || 0;

  // Keep refi loan amount in sync when ARV/Purchase Price or LTV changes
  useEffect(() => {
    const ltv = parseFloat(rentalFields.refiLtv) || 75;
    const baseValue = rentalFields.refiLtvBase === 'purchase' ? purchasePriceNum : arvNum;
    const newLoanAmount = String(Math.round(baseValue * (ltv / 100)));
    setRentalFields(prev => ({ ...prev, refiLoanAmount: newLoanAmount }));
  }, [arv, purchasePrice, rentalFields.refiLtv, rentalFields.refiLtvBase]);

  // Profit calculations - respect pct/flat modes
  const closingCostsBuy = closingMode === 'pct'
    ? purchasePriceNum * ((parseFloat(closingPct) || 0) / 100)
    : (parseFloat(closingFlat) || 0);
  const closingCostsSell = includeSellClosingCosts
    ? (sellClosingMode === 'pct' ? arvNum * ((parseFloat(sellClosingPct) || 0) / 100) : (parseFloat(sellClosingFlat) || 0))
    : 0;
  const holdingInputs = {
    mode: holdingMode,
    pct: holdingPct,
    flat: holdingFlat,
    monthlyRate: holdingMonthlyRate,
    monthlyRateMode: holdingMonthlyRateMode,
    months: holdingMonths,
    purchasePrice: purchasePriceNum,
  };
  const holdingCosts = computeHoldingCosts(holdingInputs);
  
  const totalInvestment = purchasePriceNum + totalBudget + closingCostsBuy + holdingCosts;
  const totalCosts = totalInvestment + closingCostsSell;
  const grossProfit = arvNum - totalCosts;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  
  const maxOffer = (arvNum * (maoPercentage / 100)) - totalBudget;
  const meetsMaoRule = purchasePriceNum <= maxOffer && purchasePriceNum > 0;

  // Handle user setting a target construction budget — fill filler with the difference
  const handleBudgetTargetChange = (target: number) => {
    // Sum all categories EXCEPT filler
    const currentNonFiller = Object.entries(categoryBudgets).reduce((sum, [key, val]) => {
      if (key === 'rehab_filler') return sum;
      return sum + (parseFloat(val) || 0);
    }, 0);
    const fillerAmount = Math.max(0, target - currentNonFiller);
    setCategoryBudgets(prev => ({
      ...prev,
      rehab_filler: fillerAmount > 0 ? fillerAmount.toString() : '',
    }));
    syncFillerSplit(fillerAmount);
    if (fillerAmount > 0) {
      setAutoRevealCategory('rehab_filler');
      const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format;
      toast.success(`Budget set to ${fmt(target)} — ${fmt(fillerAmount)} allocated to Contingency`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCategoryChange = (category: string, value: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSplitChange = (category: string, split: CategorySplit) => {
    setCategorySplits(prev => ({ ...prev, [category]: split }));
  };

  // Pull a historical average cost into the current budget
  const handleUseHistoricalAmount = (category: string, amount: number) => {
    setCategoryBudgets(prev => ({ ...prev, [category]: String(amount) }));
    if (splitMode) {
      setCategorySplits(prev => ({
        ...prev,
        [category]: { labor: prev[category]?.labor || '', material: String(amount) },
      }));
    }
    setAutoRevealCategory(category);
    const label = getBudgetCategories().find(c => c.value === category)?.label || category;
    toast.success(`Applied historical average to ${label}`);
  };

  // Seed auto-populated amounts into Material for categories that have no saved split
  const seedMaterialSplits = (
    savedSplits: Record<string, CategorySplit>,
    budgets: Record<string, string>,
    splitModeOn: boolean
  ): Record<string, CategorySplit> => {
    if (!splitModeOn) return savedSplits;
    const next = { ...savedSplits };
    Object.entries(budgets).forEach(([cat, val]) => {
      const total = parseFloat(val) || 0;
      if (total > 0 && !next[cat]) {
        next[cat] = { labor: '', material: String(total) };
      }
    });
    return next;
  };

  // Keep the auto-filled Contingency split tracking Material until the user sets Labor manually
  const syncFillerSplit = (fillerAmount: number) => {
    if (!splitMode) return;
    setCategorySplits(prev => {
      const existing = prev.rehab_filler;
      if ((parseFloat(existing?.labor || '') || 0) > 0) return prev;
      return {
        ...prev,
        rehab_filler: { labor: '', material: fillerAmount > 0 ? String(fillerAmount) : '' },
      };
    });
  };

  const handleSplitModeChange = (enabled: boolean) => {
    setSplitMode(enabled);
    try { localStorage.setItem(SPLIT_MODE_KEY, String(enabled)); } catch {}
    if (enabled) {
      // Seed material with the existing total for categories that have no split yet
      setCategorySplits(prev => {
        const next = { ...prev };
        Object.entries(categoryBudgets).forEach(([cat, val]) => {
          const total = parseFloat(val) || 0;
          const existing = next[cat];
          const existingTotal = (parseFloat(existing?.labor || '') || 0) + (parseFloat(existing?.material || '') || 0);
          if (total > 0 && existingTotal !== total) {
            next[cat] = { labor: '', material: String(total) };
          }
        });
        return next;
      });
    }
  };

  const laborTotal = Object.values(categorySplits).reduce((sum, s) => sum + (parseFloat(s?.labor || '') || 0), 0);
  const materialTotal = Object.values(categorySplits).reduce((sum, s) => sum + (parseFloat(s?.material || '') || 0), 0);

  const handleSelectTemplate = (template: BudgetTemplate | null) => {
    if (!template) {
      handleClearAll();
      return;
    }

    if (template.id.startsWith('baseline-')) {
      const rateMatch = template.description?.match(/\$(\d+(?:\.\d+)?)\//);
      if (rateMatch) {
        setActiveBaselineRate(parseFloat(rateMatch[1]));
      }
    } else {
      setActiveBaselineRate(null);
    }

    setBudgetName(template.name);
    setBudgetDescription(template.description || '');
    setCurrentTemplateName(template.name);
    setPurchasePrice(template.purchase_price?.toString() || '');
    setArv(template.arv?.toString() || '');
    setSqft(template.sqft?.toString() || '');

    // Restore all deal parameters from template meta
    const meta = (template.category_budgets as any)?._meta;
    if (meta?.type) {
      setCalculatorType(meta.type);
    }
    setClosingPct(meta?.closingPct ?? '2');
    setHoldingPct(meta?.holdingPct ?? '3');
    setSellClosingPct(meta?.sellClosingPct ?? '6');
    setClosingMode(meta?.closingMode ?? 'pct');
    setHoldingMode(meta?.holdingMode ?? 'pct');
    setSellClosingMode(meta?.sellClosingMode ?? 'pct');
    setClosingFlat(meta?.closingFlat ?? '');
    setHoldingFlat(meta?.holdingFlat ?? '');
    setHoldingMonthlyRate(meta?.holdingMonthlyRate ?? '');
    setHoldingMonthlyRateMode(meta?.holdingMonthlyRateMode ?? 'dollar');
    setHoldingMonths(meta?.holdingMonths ?? '6');
    setSellClosingFlat(meta?.sellClosingFlat ?? '');
    setIncludeSellClosingCosts(meta?.includeSellClosingCosts ?? true);
    if (meta?.rentalFields) {
      setRentalFields({ ...defaultRentalFields, ...meta.rentalFields });
    }
    const savedSplits: Record<string, CategorySplit> = meta?.splits ?? {};
    if (typeof meta?.splitMode === 'boolean') {
      setSplitMode(meta.splitMode);
      try { localStorage.setItem(SPLIT_MODE_KEY, String(meta.splitMode)); } catch {}
    }

    const newBudgets: Record<string, string> = {};
    getBudgetCategories().forEach(cat => {
      newBudgets[cat.value] = template.category_budgets[cat.value]?.toString() || '';
    });
    setCategoryBudgets(newBudgets);
    setCategorySplits(seedMaterialSplits(savedSplits, newBudgets, typeof meta?.splitMode === 'boolean' ? meta.splitMode : splitMode));

    setTemplateJustApplied(true);
    setProfitBreakdownOpen(true);
    toast.success(`Loaded "${template.name}" template`);
  };

  const handleClearAll = () => {
    setBudgetName('');
    setBudgetDescription('');
    setPurchasePrice('');
    setArv('');
    setSqft('');
    setCurrentTemplateName('');
    setActiveBaselineRate(null);
    setRentalFields(defaultRentalFields);
    setClosingPct('2');
    setHoldingPct('3');
    setSellClosingPct('6');
    setClosingMode('pct');
    setHoldingMode('pct');
    setSellClosingMode('pct');
    setClosingFlat('');
    setHoldingFlat('');
    setHoldingMonthlyRate('');
    setHoldingMonthlyRateMode('dollar');
    setHoldingMonths('6');
    setSellClosingFlat('');
    setIncludeSellClosingCosts(true);
    
    setCategorySplits({});

    const cleared: Record<string, string> = {};
    getBudgetCategories().forEach(cat => {
      cleared[cat.value] = '';
    });
    setCategoryBudgets(cleared);
  };

  const handleImportBudgets = (budgets: Record<string, number>) => {
    setCategoryBudgets(prev => {
      const next = { ...prev };
      for (const [key, val] of Object.entries(budgets)) {
        const existing = parseFloat(next[key]) || 0;
        next[key] = (existing + val).toString();
      }
      return next;
    });
    // Imported amounts land in Material when split mode is on (labor preserved)
    if (splitMode) {
      setCategorySplits(prev => {
        const next = { ...prev };
        for (const [key, val] of Object.entries(budgets)) {
          const existing = next[key];
          const materialNum = (parseFloat(existing?.material || '') || 0) + val;
          next[key] = { labor: existing?.labor || '', material: String(materialNum) };
        }
        return next;
      });
    }
    setTemplateJustApplied(true);
  };

  // Recalculate Filler when sqft changes while a baseline is active
  useEffect(() => {
    if (activeBaselineRate !== null) {
      const sqftNum = parseFloat(sqft) || 0;
      if (sqftNum <= 0) {
        setCategoryBudgets(prev => ({ ...prev, rehab_filler: '' }));
        syncFillerSplit(0);
        return;
      }
      const baselineTotal = sqftNum * activeBaselineRate;
      const stored = localStorage.getItem('budget-category-presets');
      const presets: { category: string; pricePerSqft: number; mode?: string }[] = stored ? JSON.parse(stored) : [];
      const presetsTotal = presets.reduce((sum, p) => {
        return sum + (p.mode === 'flat' ? p.pricePerSqft : sqftNum * p.pricePerSqft);
      }, 0);
      const fillerValue = Math.max(0, baselineTotal - presetsTotal);
      setCategoryBudgets(prev => ({
        ...prev,
        rehab_filler: fillerValue.toString(),
      }));
      syncFillerSplit(fillerValue);
    }
  }, [sqft, activeBaselineRate, splitMode]);

  const getCategoryBudgetsObject = () => {
    const budgets: Record<string, number | any> = {};
    getBudgetCategories().forEach(cat => {
      const val = parseFloat(categoryBudgets[cat.value]) || 0;
      if (val > 0) {
        budgets[cat.value] = val;
      }
    });
    budgets._meta = {
      type: calculatorType,
      closingPct,
      holdingPct,
      sellClosingPct,
      closingMode,
      holdingMode,
      sellClosingMode,
      closingFlat,
      holdingFlat,
      holdingMonthlyRate,
      holdingMonthlyRateMode,
      holdingMonths,
      sellClosingFlat,
      includeSellClosingCosts,
      rentalFields,
      splitMode,
      splits: categorySplits,
    };
    return budgets;
  };

  const handleSave = async () => {
    if (!budgetName.trim()) {
      toast.error('Please enter a name for this budget');
      return;
    }

    const hasAnyBudget = Object.values(categoryBudgets).some(val => parseFloat(val) > 0);
    if (!hasAnyBudget) {
      toast.error('Please enter at least one category budget');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const trimmedName = budgetName.trim();
      const categoryBudgetsObj = getCategoryBudgetsObject();
      const totalBudget = Object.entries(categoryBudgetsObj)
        .filter(([k]) => k !== '_meta')
        .reduce((sum, [, v]) => sum + (typeof v === 'number' ? v : 0), 0);

      const templateData = {
        name: trimmedName,
        description: budgetDescription.trim() || null,
        purchase_price: parseFloat(purchasePrice) || 0,
        arv: parseFloat(arv) || 0,
        sqft: parseInt(sqft) || null,
        category_budgets: categoryBudgetsObj,
        total_budget: totalBudget,
      };

      // Check if a template with this name already exists for this user
      const { data: existing } = await supabase
        .from('budget_templates')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', trimmedName)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('budget_templates')
          .update(templateData)
          .eq('id', existing.id);
        if (error) throw error;
        toast.success('Budget updated');
        setTemplateRefreshKey(prev => prev + 1);
      } else {
        const { error } = await supabase
          .from('budget_templates')
          .insert({ ...templateData, user_id: user.id });
        if (error) throw error;
        toast.success('Budget saved to folder');
        setTemplateRefreshKey(prev => prev + 1);
      }
      setCurrentTemplateName(trimmedName);
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToProject = async (projectId: string) => {
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    const hasAnyBudget = Object.values(categoryBudgets).some(val => parseFloat(val) > 0);
    if (!hasAnyBudget) {
      toast.error('Please enter at least one category budget');
      return;
    }

    setIsSaving(true);

    try {
      const categoryBudgetsObj: Record<string, number> = {};
      for (const cat of getBudgetCategories()) {
        const val = parseFloat(categoryBudgets[cat.value]) || 0;
        if (val > 0) {
          categoryBudgetsObj[cat.value] = val;
        }
      }

      const pendingPayload = {
        total_budget: totalBudget,
        category_budgets: categoryBudgetsObj,
        applied_at: new Date().toISOString(),
        template_name: currentTemplateName || budgetName || null,
      };

      const { error } = await supabase
        .from('projects')
        .update({ pending_budget: pendingPayload } as any)
        .eq('id', projectId);

      if (error) throw error;

      toast.success(`Budget of ${formatCurrency(totalBudget)} staged for approval — view the project to accept`);
    } catch (error: any) {
      console.error('Error applying budget:', error);
      toast.error(error.message || 'Failed to apply budget');
    } finally {
      setIsSaving(false);
    }
  };

  const canExport = totalBudget > 0 || purchasePriceNum > 0 || arvNum > 0;

  const handleExportPdf = () => {
    const lineItems = getBudgetCategories()
      .map(cat => ({
        label: cat.label,
        amount: parseFloat(categoryBudgets[cat.value]) || 0,
        labor: parseFloat(categorySplits[cat.value]?.labor || '') || 0,
        material: parseFloat(categorySplits[cat.value]?.material || '') || 0,
      }))
      .filter(li => li.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    generateBudgetPdf({
      dealName: currentTemplateName || budgetName || 'Untitled Deal',
      dealDescription: budgetDescription || undefined,
      companyName: companySettings?.company_name ?? undefined,
      logoUrl: companySettings?.logo_url ?? undefined,
      calculatorType,
      purchasePrice: purchasePriceNum,
      arv: arvNum,
      sqft: parseFloat(sqft) || 0,
      totalBudget,
      maoPercentage,
      maxOffer,
      closingCostsBuy,
      holdingCosts,
      closingCostsSell,
      includeSellClosingCosts,
      closingLabel: closingMode === 'pct' ? `(${closingPct}%)` : '(flat)',
      holdingLabel: holdingCostLabel(holdingInputs),
      sellClosingLabel: sellClosingMode === 'pct' ? `(${sellClosingPct}%)` : '(flat)',
      totalInvestment,
      totalCosts,
      grossProfit,
      roi,
      lineItems,
      rentalFields,
      splitMode,
      laborTotal,
      materialTotal,
    });
    toast.success('Deal sheet generated — use your print dialog to save as PDF');
  };

  const subtitleText = calculatorType === 'fix_flip'
    ? 'Build and manage construction budgets with real-time MAO tracking'
    : 'Analyze rental income, expenses, and cash flow projections';

  const analysisTitle = calculatorType === 'fix_flip'
    ? 'Profit Breakdown'
    : 'Cash Flow Analysis';

  const isMobile = useIsMobile();

  return (
    <>
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b bg-background gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Budget Calculator</h1>
            <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">{subtitleText}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <TemplatePicker
              onSelectTemplate={handleSelectTemplate}
              onCreateNew={handleClearAll}
              currentTemplateName={currentTemplateName}
              sqft={sqft}
              onSqftChange={setSqft}
              refreshKey={templateRefreshKey}
            />
            <div className="hidden md:flex items-center gap-2 rounded-md border border-border px-2.5 h-9">
              <Label htmlFor="split-mode" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
                Labor / Material
              </Label>
              <Switch id="split-mode" checked={splitMode} onCheckedChange={handleSplitModeChange} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCostHistoryOpen(true)}
              className="gap-1.5"
              title="Cost history from past projects"
            >
              <History className="h-4 w-4" />
              <span className="hidden lg:inline">Cost History</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => setImportModalOpen(true)} title="Import budget">
              <Upload className="h-4 w-4" />
            </Button>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPdf}
                      disabled={!canExport}
                      className="gap-1.5"
                    >
                      <FileDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Export PDF</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {canExport
                    ? 'Export a branded deal sheet to share'
                    : 'Enter a purchase price, ARV, or budget first'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="icon" onClick={handleClearAll} title="Clear all">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* MAO / Margin Gauge - Sticky */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-b bg-muted/30">
            <MAOGauge
              arv={arvNum}
              currentBudget={totalBudget}
              purchasePrice={purchasePriceNum}
              sqft={parseFloat(sqft) || 0}
              maoPercentage={maoPercentage}
              onPercentageChange={setMaoPercentage}
              onBudgetTargetChange={handleBudgetTargetChange}
            />
            {splitMode && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs border-t border-border/50 pt-2">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-semibold">Labor / Material Split</span>
                <span className="font-mono">
                  Labor <span className="font-semibold text-primary">{formatCurrency(laborTotal)}</span>
                  <span className="text-muted-foreground ml-1">
                    ({totalBudget > 0 ? ((laborTotal / totalBudget) * 100).toFixed(0) : 0}%)
                  </span>
                </span>
                <span className="font-mono">
                  Material <span className="font-semibold text-primary">{formatCurrency(materialTotal)}</span>
                  <span className="text-muted-foreground ml-1">
                    ({totalBudget > 0 ? ((materialTotal / totalBudget) * 100).toFixed(0) : 0}%)
                  </span>
                </span>
                {Math.abs(totalBudget - (laborTotal + materialTotal)) > 0.5 && (
                  <span className="text-muted-foreground">
                    {formatCurrency(Math.max(0, totalBudget - (laborTotal + materialTotal)))} unsplit
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Deal Sidebar - Left Panel */}
            <DealSidebar
            isMobile={isMobile}
            purchasePrice={purchasePrice}
            onPurchasePriceChange={setPurchasePrice}
            arv={arv}
            onArvChange={setArv}
            sqft={sqft}
            onSqftChange={setSqft}
            budgetName={budgetName}
            onBudgetNameChange={setBudgetName}
            budgetDescription={budgetDescription}
            onBudgetDescriptionChange={setBudgetDescription}
            onSave={handleSave}
            onApplyToProject={handleApplyToProject}
            isSaving={isSaving}
            projects={projects}
            isLoadingProjects={isLoadingProjects}
            includeSellClosingCosts={includeSellClosingCosts}
            onSellClosingCostsChange={setIncludeSellClosingCosts}
            calculatorType={calculatorType}
            onCalculatorTypeChange={setCalculatorType}
            rentalFields={rentalFields}
            onRentalFieldChange={handleRentalFieldChange}
            closingPct={closingPct}
            onClosingPctChange={setClosingPct}
            holdingPct={holdingPct}
            onHoldingPctChange={setHoldingPct}
            sellClosingPct={sellClosingPct}
            onSellClosingPctChange={setSellClosingPct}
            closingMode={closingMode}
            holdingMode={holdingMode}
            sellClosingMode={sellClosingMode}
            onClosingModeChange={setClosingMode}
            onHoldingModeChange={setHoldingMode}
            onSellClosingModeChange={setSellClosingMode}
            closingFlat={closingFlat}
            holdingFlat={holdingFlat}
            sellClosingFlat={sellClosingFlat}
            onClosingFlatChange={setClosingFlat}
            onHoldingFlatChange={setHoldingFlat}
            holdingMonthlyRate={holdingMonthlyRate}
            onHoldingMonthlyRateChange={setHoldingMonthlyRate}
            holdingMonthlyRateMode={holdingMonthlyRateMode}
            onHoldingMonthlyRateModeChange={setHoldingMonthlyRateMode}
            holdingMonths={holdingMonths}
            onHoldingMonthsChange={setHoldingMonths}
            onSellClosingFlatChange={setSellClosingFlat}
          />
          
          {/* Budget Canvas - Primary Workspace */}
          <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Category Cards Grid */}
                <BudgetCanvas
                  categoryBudgets={categoryBudgets}
                  onCategoryChange={handleCategoryChange}
                  sqft={sqft}
                  baselineActive={activeBaselineRate !== null}
                  expandAll={templateJustApplied}
                  onExpandHandled={() => setTemplateJustApplied(false)}
                  autoRevealCategory={autoRevealCategory}
                  onRevealHandled={() => setAutoRevealCategory(null)}
                  splitMode={splitMode}
                  splits={categorySplits}
                  onSplitChange={handleSplitChange}
                />

                {/* Analysis Section - Collapsible */}
                <div className="mt-8">
                  <Collapsible open={profitBreakdownOpen} onOpenChange={setProfitBreakdownOpen}>
                    <div className="flex items-center gap-3">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                          <ChevronDown className={`h-4 w-4 transition-transform ${profitBreakdownOpen ? '' : '-rotate-90'}`} />
                          <Calculator className="h-4 w-4" />
                          <span className="font-medium">{analysisTitle}</span>
                        </Button>
                      </CollapsibleTrigger>
                      <Separator className="flex-1" />
                    </div>

                    <CollapsibleContent className="pt-6">
                      {calculatorType === 'fix_flip' && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Profit Analysis</CardTitle>
                            <CardDescription>
                              Detailed cost analysis based on current budget and deal parameters
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {/* Costs Column */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Acquisition</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Purchase Price</span>
                                    <span className="font-mono">{formatCurrency(purchasePriceNum)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Closing Costs {closingMode === 'pct' ? `(${closingPct}%)` : '(flat)'}</span>
                                    <span className="font-mono">{formatCurrency(closingCostsBuy)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Rehab Column */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Construction & Holding</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Construction Budget</span>
                                    <span className="font-mono">{formatCurrency(totalBudget)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Holding Costs {holdingCostLabel(holdingInputs)}</span>
                                    <span className="font-mono">{formatCurrency(holdingCosts)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Sale Column */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sale</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>ARV (Sale Price)</span>
                                    <span className="font-mono">{formatCurrency(arvNum)}</span>
                                  </div>
                                  {includeSellClosingCosts && (
                                    <div className="flex justify-between text-sm">
                                      <span>Selling Costs {sellClosingMode === 'pct' ? `(${sellClosingPct}%)` : '(flat)'}</span>
                                      <span className="font-mono">-{formatCurrency(closingCostsSell)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Profit Column */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Total Investment</span>
                                    <span className="font-mono">{formatCurrency(totalInvestment)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm font-medium">
                                    <span>Gross Profit</span>
                                    <span className={`font-mono ${grossProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                      {formatCurrency(grossProfit)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm font-medium">
                                    <span>ROI</span>
                                    <span className={`font-mono ${roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                      {roi.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                              <div className="p-4 rounded-lg bg-muted/50 text-center">
                                <p className="text-sm text-muted-foreground">Total Investment</p>
                                <p className="text-2xl font-bold font-mono">{formatCurrency(totalInvestment)}</p>
                              </div>
                              <div className={`p-4 rounded-lg text-center ${grossProfit >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                                <p className="text-sm text-muted-foreground">Projected Profit</p>
                                <p className={`text-2xl font-bold font-mono ${grossProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                  {formatCurrency(grossProfit)}
                                </p>
                              </div>
                              <div className={`p-4 rounded-lg text-center ${roi >= 20 ? 'bg-green-500/10' : roi >= 0 ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
                                <p className="text-sm text-muted-foreground">Return on Investment</p>
                                <p className={`text-2xl font-bold font-mono ${roi >= 20 ? 'text-green-500' : roi >= 0 ? 'text-amber-500' : 'text-destructive'}`}>
                                  {roi.toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            {/* MAO Rule Check */}
                            {purchasePriceNum > 0 && arvNum > 0 && (
                              <div className={`mt-6 p-4 rounded-lg ${meetsMaoRule ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                                <div className="flex items-center gap-2">
                                  {meetsMaoRule ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                  )}
                                  <span className={`font-medium ${meetsMaoRule ? 'text-green-500' : 'text-destructive'}`}>
                                    {meetsMaoRule
                                      ? `✓ Meets ${maoPercentage}% Rule - Your offer is ${formatCurrency(maxOffer - purchasePriceNum)} under the max!`
                                      : `✗ Over ${maoPercentage}% Rule - Your offer is ${formatCurrency(purchasePriceNum - maxOffer)} over the max!`}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {calculatorType === 'rental' && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Loan</h3>
                          <Tabs defaultValue="regular">
                            <TabsList>
                              <TabsTrigger value="regular">Regular</TabsTrigger>
                              <TabsTrigger value="refi">Refi</TabsTrigger>
                            </TabsList>
                            <TabsContent value="regular">
                              <RentalAnalysis
                                purchasePrice={purchasePriceNum}
                                arv={arvNum}
                                totalBudget={totalBudget}
                                rentalFields={rentalFields}
                                formatCurrency={formatCurrency}
                                closingCostsBuy={closingCostsBuy}
                                holdingCosts={holdingCosts}
                                closingCostsSell={closingCostsSell}
                              />
                            </TabsContent>
                            <TabsContent value="refi">
                              <BRRRAnalysis
                                purchasePrice={purchasePriceNum}
                                arv={arvNum}
                                totalBudget={totalBudget}
                                closingCostsBuy={closingCostsBuy}
                                holdingCosts={holdingCosts}
                                rentalFields={rentalFields}
                                formatCurrency={formatCurrency}
                              />
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}


                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </ScrollArea>
          </div>

        </div>
      </div>
    </MainLayout>

    <ImportBudgetModal
      open={importModalOpen}
      onOpenChange={setImportModalOpen}
      onImport={handleImportBudgets}
    />
    </>
  );
}

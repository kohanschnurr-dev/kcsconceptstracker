import { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Landmark, DollarSign, Percent, Save, Loader2, TrendingUp, TrendingDown, Clock, Package, Plus, Pencil, Trash2, Star, ChevronDown, ChevronUp, MoreVertical, Settings, CalendarClock, RotateCcw, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { parseDateString } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LoanPreset {
  id?: string;
  name: string;
  interestRate: number;
  loanTermMonths: number;
  points: number;
  closingCostsPercent: number;
  interestOnly: boolean;
  isBuiltIn?: boolean;
  isDefault?: boolean;
}

const BUILT_IN_PRESETS: LoanPreset[] = [
  { name: 'Standard Hard Money', interestRate: 12, loanTermMonths: 6, points: 3, closingCostsPercent: 2, interestOnly: true, isBuiltIn: true },
  { name: 'Competitive Rate', interestRate: 10, loanTermMonths: 12, points: 2, closingCostsPercent: 2, interestOnly: true, isBuiltIn: true },
  { name: 'Extended Term', interestRate: 11, loanTermMonths: 18, points: 2.5, closingCostsPercent: 2, interestOnly: true, isBuiltIn: true },
  { name: 'Conventional 30yr', interestRate: 7, loanTermMonths: 360, points: 1, closingCostsPercent: 2, interestOnly: false, isBuiltIn: true },
];

const DEFAULT_TERM_PRESETS = [6, 12, 18, 360];
const TERM_PRESETS_KEY = 'loan-term-presets';

function getTermPresets(): number[] {
  try {
    const stored = localStorage.getItem(TERM_PRESETS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 4 && parsed.every((n: any) => typeof n === 'number' && n > 0)) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_TERM_PRESETS;
}

function formatTermLabel(months: number): string {
  return `${months}`;
}

function calculateToDateMonths(startDateStr: string, endDate?: Date): number {
  const start = parseDateString(startDateStr);
  const end = endDate || new Date();
  const diffMs = end.getTime() - start.getTime();
  const months = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  return Math.round(months * 10) / 10;
}

interface HardMoneyLoanCalculatorProps {
  projectId: string;
  purchasePrice: number;
  totalBudget: number;
  arv: number;
  projectStartDate?: string;
  initialLoanAmount?: number;
  initialInterestRate?: number;
  initialLoanTermMonths?: number;
  initialPoints?: number;
  initialClosingCosts?: number;
  initialInterestOnly?: boolean;
}

export function HardMoneyLoanCalculator({
  projectId,
  purchasePrice,
  totalBudget,
  arv,
  projectStartDate,
  initialLoanAmount,
  initialInterestRate = 12,
  initialLoanTermMonths = 6,
  initialPoints = 3,
  initialClosingCosts = 0,
  initialInterestOnly = true,
}: HardMoneyLoanCalculatorProps) {
  // Editable purchase price for testing scenarios
  const [editablePurchasePrice, setEditablePurchasePrice] = useState(purchasePrice);
  
  // Default loan amount to 75% of purchase price if not set
  const defaultLoanAmount = initialLoanAmount ?? (editablePurchasePrice * 0.75);
  const defaultClosingCosts = initialClosingCosts ?? (editablePurchasePrice * 0.02);
  
  const [loanAmount, setLoanAmount] = useState(defaultLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTermMonths, setLoanTermMonths] = useState(initialLoanTermMonths);
  const [points, setPoints] = useState(initialPoints);
  const [closingCosts, setClosingCosts] = useState(defaultClosingCosts);
  const [interestOnly, setInterestOnly] = useState(initialInterestOnly);
  const [saving, setSaving] = useState(false);

  // Preset management
  const [userPresets, setUserPresets] = useState<LoanPreset[]>([]);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  // Custom term popover
  const [customTermOpen, setCustomTermOpen] = useState(false);
  const [customTermInput, setCustomTermInput] = useState('');

  // Term presets settings
  const [termPresets, setTermPresets] = useState<number[]>(getTermPresets);
  const [termSettingsOpen, setTermSettingsOpen] = useState(false);
  const [editTermSlots, setEditTermSlots] = useState<string[]>(termPresets.map(String));

  // To Date calculation
  const [toDateEndDate, setToDateEndDate] = useState<Date>(new Date());
  const [termDaysOverride, setTermDaysOverride] = useState<number | null>(null);

  const toDateMonths = useMemo(() => {
    if (!projectStartDate) return null;
    return calculateToDateMonths(projectStartDate, toDateEndDate);
  }, [projectStartDate, toDateEndDate]);

  const toDateDays = useMemo(() => {
    if (!projectStartDate) return null;
    const start = parseDateString(projectStartDate);
    return Math.round((toDateEndDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [projectStartDate, toDateEndDate]);


  // Edit preset dialog
  const [editPresetOpen, setEditPresetOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<LoanPreset | null>(null);
  const [editPresetName, setEditPresetName] = useState('');
  const [editInterestRate, setEditInterestRate] = useState(0);
  const [editLoanTermMonths, setEditLoanTermMonths] = useState(0);
  const [editPoints, setEditPoints] = useState(0);
  const [editClosingCostsPercent, setEditClosingCostsPercent] = useState(2);
  const [editInterestOnly, setEditInterestOnly] = useState(true);
  const [updatingPreset, setUpdatingPreset] = useState(false);

  // Delete confirmation
  const [deletePresetOpen, setDeletePresetOpen] = useState(false);
  const [deletingPreset, setDeletingPreset] = useState<LoanPreset | null>(null);

  // Presets collapsible state
  const [presetsOpen, setPresetsOpen] = useState(false);

  // Dirty tracking — skip reset effect when user has manually edited
  const hasUserEdited = useRef(false);
  const lastSavedValues = useRef<{ loanAmount: number; interestRate: number; loanTermMonths: number; points: number; closingCosts: number; interestOnly: boolean } | null>(null);

  // Sync editable purchase price with prop
  useEffect(() => {
    setEditablePurchasePrice(purchasePrice);
  }, [purchasePrice]);

  useEffect(() => {
    if (hasUserEdited.current) {
      // Only clear dirty flag once ALL props reflect our saved values
      if (lastSavedValues.current &&
          initialLoanAmount === lastSavedValues.current.loanAmount &&
          initialInterestRate === lastSavedValues.current.interestRate &&
          initialLoanTermMonths === lastSavedValues.current.loanTermMonths &&
          initialPoints === lastSavedValues.current.points &&
          (initialClosingCosts ?? 0) === lastSavedValues.current.closingCosts &&
          initialInterestOnly === lastSavedValues.current.interestOnly) {
        hasUserEdited.current = false;
        lastSavedValues.current = null;
      }
      return;
    }
    setLoanAmount(initialLoanAmount ?? (editablePurchasePrice * 0.75));
    setInterestRate(initialInterestRate);
    setLoanTermMonths(initialLoanTermMonths);
    setPoints(initialPoints);
    setClosingCosts(initialClosingCosts ?? (editablePurchasePrice * 0.02));
    setInterestOnly(initialInterestOnly);
  }, [initialLoanAmount, initialInterestRate, initialLoanTermMonths, initialPoints, initialClosingCosts, initialInterestOnly, editablePurchasePrice]);

  // Fetch user presets and auto-load default
  useEffect(() => {
    // Skip preset auto-load if user has manually edited or just saved
    if (hasUserEdited.current) return;

    const fetchPresets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('loan_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching presets:', error);
        return;
      }

      if (data) {
        const presets = data.map(p => ({
          id: p.id,
          name: p.name,
          interestRate: Number(p.interest_rate),
          loanTermMonths: p.loan_term_months,
          points: Number(p.points),
          closingCostsPercent: Number(p.closing_costs_percent),
          interestOnly: p.interest_only ?? true,
          isDefault: p.is_default ?? false,
        }));
        setUserPresets(presets);

        // Find and auto-load the default preset if no initial loan values were provided
        const defaultPreset = presets.find(p => p.isDefault);
        if (defaultPreset && !initialLoanAmount) {
          setInterestRate(defaultPreset.interestRate);
          setLoanTermMonths(defaultPreset.loanTermMonths);
          setPoints(defaultPreset.points);
          setClosingCosts(editablePurchasePrice * (defaultPreset.closingCostsPercent / 100));
          setInterestOnly(defaultPreset.interestOnly);
        }

        // Always override term with "To Date" when available
        const currentToDate = projectStartDate ? calculateToDateMonths(projectStartDate, toDateEndDate) : null;
        if (currentToDate && currentToDate > 0) {
          setLoanTermMonths(currentToDate);
          // Set exact day count for precise interest
          const start = parseDateString(projectStartDate);
          const exactDays = Math.round((toDateEndDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          setTermDaysOverride(exactDays);
        }
      }
    };

    fetchPresets();
  }, [initialLoanAmount, editablePurchasePrice]);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({
        hm_loan_amount: loanAmount,
        hm_interest_rate: interestRate,
        hm_loan_term_months: loanTermMonths,
        hm_points: points,
        hm_closing_costs: closingCosts,
        hm_interest_only: interestOnly,
      })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to save loan details');
      console.error(error);
    } else {
      toast.success('Loan details saved');
      lastSavedValues.current = { loanAmount, interestRate, loanTermMonths, points, closingCosts, interestOnly };
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
    setSaving(false);
  };

  const loadPreset = (preset: LoanPreset) => {
    setInterestRate(preset.interestRate);
    setLoanTermMonths(preset.loanTermMonths);
    setPoints(preset.points);
    setClosingCosts(editablePurchasePrice * (preset.closingCostsPercent / 100));
    setInterestOnly(preset.interestOnly);
    toast.success(`Loaded "${preset.name}" preset`);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    setSavingPreset(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to save presets');
      setSavingPreset(false);
      return;
    }

    const closingCostsPercent = editablePurchasePrice > 0 
      ? (closingCosts / editablePurchasePrice) * 100 
      : 2;

    const { data, error } = await supabase
      .from('loan_presets')
      .insert({
        user_id: user.id,
        name: presetName.trim(),
        interest_rate: interestRate,
        loan_term_months: loanTermMonths,
        points: points,
        closing_costs_percent: closingCostsPercent,
        interest_only: interestOnly,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to save preset');
      console.error(error);
    } else if (data) {
      setUserPresets(prev => [...prev, {
        id: data.id,
        name: data.name,
        interestRate: Number(data.interest_rate),
        loanTermMonths: data.loan_term_months,
        points: Number(data.points),
        closingCostsPercent: Number(data.closing_costs_percent),
        interestOnly: data.interest_only,
      }]);
      toast.success(`Preset "${presetName}" saved`);
      setPresetName('');
      setSavePresetOpen(false);
    }
    setSavingPreset(false);
  };

  // Delete preset handler
  const handleDeletePreset = async (preset: LoanPreset) => {
    if (!preset.id) return;

    const { error } = await supabase
      .from('loan_presets')
      .delete()
      .eq('id', preset.id);

    if (error) {
      toast.error('Failed to delete preset');
      console.error(error);
    } else {
      setUserPresets(prev => prev.filter(p => p.id !== preset.id));
      toast.success(`Preset "${preset.name}" deleted`);
    }
    setDeletePresetOpen(false);
    setDeletingPreset(null);
  };

  // Open edit dialog
  const openEditDialog = (preset: LoanPreset) => {
    setEditingPreset(preset);
    setEditPresetName(preset.name);
    setEditInterestRate(preset.interestRate);
    setEditLoanTermMonths(preset.loanTermMonths);
    setEditPoints(preset.points);
    setEditClosingCostsPercent(preset.closingCostsPercent);
    setEditInterestOnly(preset.interestOnly);
    setEditPresetOpen(true);
  };

  // Update preset handler
  const handleUpdatePreset = async () => {
    if (!editingPreset?.id || !editPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    setUpdatingPreset(true);

    const { error } = await supabase
      .from('loan_presets')
      .update({
        name: editPresetName.trim(),
        interest_rate: editInterestRate,
        loan_term_months: editLoanTermMonths,
        points: editPoints,
        closing_costs_percent: editClosingCostsPercent,
        interest_only: editInterestOnly,
      })
      .eq('id', editingPreset.id);

    if (error) {
      toast.error('Failed to update preset');
      console.error(error);
    } else {
      setUserPresets(prev => prev.map(p => 
        p.id === editingPreset.id 
          ? {
              ...p,
              name: editPresetName.trim(),
              interestRate: editInterestRate,
              loanTermMonths: editLoanTermMonths,
              points: editPoints,
              closingCostsPercent: editClosingCostsPercent,
              interestOnly: editInterestOnly,
            }
          : p
      ));
      toast.success(`Preset "${editPresetName}" updated`);
      setEditPresetOpen(false);
      setEditingPreset(null);
    }
    setUpdatingPreset(false);
  };

  // Clear default handler (No Preset / Manual mode)
  const handleClearDefaultPreset = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('loan_presets')
      .update({ is_default: false })
      .eq('user_id', user.id);

    setUserPresets(prev => prev.map(p => ({ ...p, isDefault: false })));
    toast.success('Default preset cleared — using manual values');
  };

  // Set as default handler
  const handleSetDefaultPreset = async (preset: LoanPreset) => {
    if (!preset.id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First, clear any existing default
    await supabase
      .from('loan_presets')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Then set the new default
    const { error } = await supabase
      .from('loan_presets')
      .update({ is_default: true })
      .eq('id', preset.id);

    if (error) {
      toast.error('Failed to set default preset');
      console.error(error);
    } else {
      setUserPresets(prev => prev.map(p => ({
        ...p,
        isDefault: p.id === preset.id,
      })));
      toast.success(`"${preset.name}" set as default`);
    }
  };

  // Calculations
  const calculations = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const dailyRate = interestRate / 100 / 365;
    const dailyInterest = loanAmount * dailyRate;
    
    // Monthly Payment (what one full month costs - unchanged)
    let monthlyPayment: number;
    let totalInterest: number;
    
    // Use exact day count when available (To Date), otherwise convert from months
    const termDays = termDaysOverride ?? Math.round(loanTermMonths * 30.44);
    
    if (interestOnly) {
      monthlyPayment = (loanAmount * (interestRate / 100)) / 12;
      // Use daily accrual for total interest
      totalInterest = dailyInterest * termDays;
    } else {
      // Amortizing payment formula
      if (monthlyRate > 0 && loanTermMonths > 0) {
        monthlyPayment = loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
          (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
        totalInterest = (monthlyPayment * loanTermMonths) - loanAmount;
      } else {
        monthlyPayment = loanAmount / loanTermMonths;
        totalInterest = 0;
      }
    }
    
    // Points cost
    const pointsCost = loanAmount * (points / 100);
    
    // Total loan cost
    const totalLoanCost = totalInterest + pointsCost + closingCosts;
    
    // Effective APR (annualized cost including all fees)
    const termYears = loanTermMonths / 12;
    const effectiveAPR = termYears > 0 ? ((totalLoanCost / loanAmount) / termYears) * 100 : 0;
    
    return {
      monthlyPayment,
      dailyInterest,
      totalInterest,
      pointsCost,
      totalLoanCost,
      effectiveAPR,
    };
  }, [loanAmount, interestRate, loanTermMonths, points, closingCosts, interestOnly, termDaysOverride]);

  // Rate sensitivity analysis
  const rateSensitivity = useMemo(() => {
    const sellingCosts = arv * 0.06; // 6% selling costs
    const termDays = termDaysOverride ?? Math.round(loanTermMonths * 30.44);
    
    return [0, 1, 2].map(bump => {
      const adjustedRate = interestRate + bump;
      const dailyInt = loanAmount * (adjustedRate / 100 / 365);
      const adjustedInterest = dailyInt * termDays;
      const pointsCost = loanAmount * (points / 100);
      const adjustedProfit = arv - editablePurchasePrice - totalBudget - adjustedInterest - pointsCost - closingCosts - sellingCosts;
      
      return { 
        rate: adjustedRate, 
        interest: adjustedInterest, 
        profit: adjustedProfit 
      };
    });
  }, [loanAmount, interestRate, loanTermMonths, points, closingCosts, arv, editablePurchasePrice, totalBudget, termDaysOverride]);

  // Payoff timeline comparison - only show terms up to current loan term
  const payoffComparison = useMemo(() => {
    const dailyInt = loanAmount * (interestRate / 100 / 365);
    const allowedMonths = [4, 6, 12, 18].filter(m => m <= loanTermMonths);
    
    // Include the current fractional term if it's from "To Date"
    const isFractional = loanTermMonths % 1 !== 0;
    if (isFractional && !allowedMonths.includes(loanTermMonths)) {
      allowedMonths.push(loanTermMonths);
      allowedMonths.sort((a, b) => a - b);
    }
    
    const currentTermDays = termDaysOverride ?? Math.round(loanTermMonths * 30.44);
    
    return allowedMonths.map(months => {
      const days = months === loanTermMonths && termDaysOverride ? termDaysOverride : Math.round(months * 30.44);
      return {
        months,
        interest: dailyInt * days,
        savings: months < loanTermMonths ? dailyInt * (currentTermDays - days) : 0,
        isCurrent: months === loanTermMonths,
      };
    });
  }, [loanAmount, interestRate, loanTermMonths, termDaysOverride]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const loanToValue = editablePurchasePrice > 0 ? ((loanAmount / editablePurchasePrice) * 100) : 0;

  const handleSaveTermPresets = () => {
    const newPresets = editTermSlots.map(s => {
      const val = parseFloat(s);
      return isNaN(val) || val <= 0 ? 6 : val;
    });
    setTermPresets(newPresets);
    localStorage.setItem(TERM_PRESETS_KEY, JSON.stringify(newPresets));
    setTermSettingsOpen(false);
    toast.success('Term presets saved');
  };

  const handleResetTermPresets = () => {
    setTermPresets(DEFAULT_TERM_PRESETS);
    setEditTermSlots(DEFAULT_TERM_PRESETS.map(String));
    localStorage.removeItem(TERM_PRESETS_KEY);
    toast.success('Term presets reset to defaults');
  };

  const termOptions = termPresets;

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Loan Calculator
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPresetsOpen(!presetsOpen)}
            >
              <Package className="h-4 w-4 mr-2" />
              Presets
              {presetsOpen ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        </CardHeader>

        {/* Collapsible Presets Panel */}
        <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
          <CollapsibleContent className="border-b border-border">
            <div className="px-6 py-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Loan Presets</h4>
                <Button size="sm" variant="outline" onClick={() => setSavePresetOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Save Current
                </Button>
              </div>
              
              {/* Built-in Presets */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Built-in</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!userPresets.some(p => p.isDefault) ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleClearDefaultPreset}
                  >
                    None / Manual
                  </Button>
                  {BUILT_IN_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => loadPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* User Presets */}
              {userPresets.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">My Presets</p>
                  <div className="flex flex-wrap gap-2">
                    {userPresets.map((preset) => (
                      <div key={preset.id} className="flex items-center gap-1 group">
                        <Button
                          variant={preset.isDefault ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => loadPreset(preset)}
                          className="flex items-center gap-1"
                        >
                          {preset.isDefault && <Star className="h-3 w-3 fill-current" />}
                          {preset.name}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSetDefaultPreset(preset)}>
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(preset)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setDeletingPreset(preset);
                                setDeletePresetOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Inputs */}
            <div className="space-y-5">
              {/* Purchase Price (Editable) */}
              <div className="space-y-2">
                <Label htmlFor="purchase-price">Purchase Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="purchase-price"
                    type="number"
                    value={editablePurchasePrice || ''}
                    onChange={(e) => setEditablePurchasePrice(Number(e.target.value))}
                    className="pl-9 rounded-sm"
                    placeholder="0"
                  />
                </div>
                {editablePurchasePrice !== purchasePrice && (
                  <p className="text-xs text-warning">Testing mode - differs from project price</p>
                )}
              </div>

              {/* Loan Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="loan-amount">Loan Amount</Label>
                  <span className="text-xs text-muted-foreground">
                    {loanToValue.toFixed(0)}% of Purchase Price
                  </span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loan-amount"
                    type="number"
                    value={loanAmount || ''}
                    onChange={(e) => { hasUserEdited.current = true; setLoanAmount(Number(e.target.value)); }}
                    className="pl-9 rounded-sm"
                    placeholder="0"
                  />
                </div>
                <Slider
                  value={[loanAmount]}
                  onValueChange={([val]) => { hasUserEdited.current = true; setLoanAmount(val); }}
                  min={0}
                  max={editablePurchasePrice > 0 ? editablePurchasePrice : 500000}
                  step={1000}
                  className="mt-2"
                />
              </div>

              {/* Interest Rate + Loan Term — same row */}
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Annual Interest Rate</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="interest-rate"
                      type="number"
                      value={interestRate || ''}
                      onChange={(e) => { hasUserEdited.current = true; setInterestRate(Number(e.target.value)); }}
                      className="pl-9 rounded-sm"
                      step={0.01}
                      min={0}
                      max={30}
                      placeholder="12"
                    />
                  </div>
                </div>

                {/* Loan Term */}
                <div className="space-y-2">
                  <Label>Loan Term (Months)</Label>
                <div className="flex flex-wrap gap-2">
                  {termOptions.map((term) => (
                    <Button
                      key={term}
                      type="button"
                      variant={loanTermMonths === term ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setLoanTermMonths(term); setTermDaysOverride(null); }}
                      className="rounded-sm min-w-[4rem]"
                    >
                      {formatTermLabel(term)}
                    </Button>
                  ))}
                  <Popover open={customTermOpen} onOpenChange={setCustomTermOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={!termOptions.includes(loanTermMonths) && toDateMonths !== loanTermMonths ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-sm min-w-[4rem]"
                      >
                        {!termOptions.includes(loanTermMonths) && toDateMonths !== loanTermMonths ? loanTermMonths : 'Custom'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-3" align="end">
                      <div className="space-y-2">
                        <Label htmlFor="custom-term" className="text-xs">Custom Term (Months)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="custom-term"
                            type="number"
                            value={customTermInput}
                            onChange={(e) => setCustomTermInput(e.target.value)}
                            className="h-8 rounded-sm text-sm"
                            placeholder="e.g. 9 or 1.5"
                            min={0.5}
                            max={600}
                            step={0.5}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = parseFloat(customTermInput);
                                if (val > 0 && val <= 600) {
                                  setLoanTermMonths(val);
                                  setTermDaysOverride(null);
                                  setCustomTermOpen(false);
                                  setCustomTermInput('');
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              const val = parseFloat(customTermInput);
                              if (val > 0 && val <= 600) {
                                setLoanTermMonths(val);
                                setTermDaysOverride(null);
                                setCustomTermOpen(false);
                                setCustomTermInput('');
                              }
                            }}
                          >
                            Set
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* To Date Button + Date Picker */}
                  {projectStartDate && toDateMonths !== null && toDateMonths > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant={loanTermMonths === toDateMonths ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-sm rounded-r-none border-primary/50 min-w-[4rem]"
                        onClick={() => { setLoanTermMonths(toDateMonths); if (toDateDays) setTermDaysOverride(toDateDays); }}
                      >
                        <CalendarClock className="h-3.5 w-3.5 mr-1" />
                        To Date
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant={loanTermMonths === toDateMonths ? 'default' : 'outline'}
                            size="sm"
                            className="rounded-sm rounded-l-none border-l-0 border-primary/50 px-1.5"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <div className="p-3 pb-1 text-xs text-muted-foreground font-medium">
                            {toDateDays} days from start
                          </div>
                          <Calendar
                            mode="single"
                            selected={toDateEndDate}
                            onSelect={(date) => {
                              if (date) {
                                setToDateEndDate(date);
                                const newMonths = calculateToDateMonths(projectStartDate, date);
                                if (newMonths > 0) {
                                  setLoanTermMonths(newMonths);
                                  const start = parseDateString(projectStartDate);
                                  const exactDays = Math.round((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                  setTermDaysOverride(exactDays);
                                }
                              }
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                          <div className="px-3 pb-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs h-7"
                              onClick={() => {
                                const today = new Date();
                                setToDateEndDate(today);
                                const newMonths = calculateToDateMonths(projectStartDate, today);
                                if (newMonths > 0) {
                                  setLoanTermMonths(newMonths);
                                  const start = parseDateString(projectStartDate);
                                  const exactDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                  setTermDaysOverride(exactDays);
                                }
                              }}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reset to Today
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {/* Term Settings Gear */}
                  <Popover open={termSettingsOpen} onOpenChange={(open) => {
                    setTermSettingsOpen(open);
                    if (open) setEditTermSlots(termPresets.map(String));
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-sm h-9 w-9 p-0"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="end">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Term Presets</Label>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleResetTermPresets}>
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                          </Button>
                        </div>
                        {editTermSlots.map((slot, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-10">Slot {i + 1}</span>
                            <Input
                              type="number"
                              value={slot}
                              onChange={(e) => {
                                const updated = [...editTermSlots];
                                updated[i] = e.target.value;
                                setEditTermSlots(updated);
                              }}
                              className="h-7 text-xs rounded-sm"
                              min={0.5}
                              max={600}
                              step={0.5}
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {parseFloat(slot) >= 12 && parseFloat(slot) % 12 === 0
                                ? `= ${parseFloat(slot) / 12}yr`
                                : 'mo'}
                            </span>
                          </div>
                        ))}
                        <Button size="sm" className="w-full h-7 text-xs" onClick={handleSaveTermPresets}>
                          Save Presets
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              {/* Points/Origination */}
              <div className="space-y-2">
                <Label htmlFor="points">Points / Origination (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="points"
                    type="number"
                    value={points || ''}
                    onChange={(e) => { hasUserEdited.current = true; setPoints(Number(e.target.value)); }}
                    className="pl-9 rounded-sm"
                    step={0.5}
                    min={0}
                    max={10}
                  />
                </div>
              </div>

              {/* Closing Costs */}
              <div className="space-y-2">
                <Label htmlFor="closing-costs">Closing Costs</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="closing-costs"
                    type="number"
                    value={closingCosts || ''}
                    onChange={(e) => { hasUserEdited.current = true; setClosingCosts(Number(e.target.value)); }}
                    className="pl-9 rounded-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              </div>

              {/* Interest Type Toggle */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-muted/50 border border-border">
                <div>
                  <Label htmlFor="interest-type" className="cursor-pointer">Interest Only</Label>
                  <p className="text-xs text-muted-foreground">
                    {interestOnly ? 'Pay interest only during term' : 'Principal + Interest payments'}
                  </p>
                </div>
                <Switch
                  id="interest-type"
                  checked={interestOnly}
                  onCheckedChange={(val) => { hasUserEdited.current = true; setInterestOnly(val); }}
                />
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-sm bg-primary/10 border border-primary/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Payment</p>
                  <p className="text-lg font-bold font-mono text-primary">
                    {formatCurrency(calculations.monthlyPayment)}
                  </p>
                </div>
                <div className="p-3 rounded-sm bg-warning/10 border border-warning/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                  <p className="text-lg font-bold font-mono text-warning">
                    {formatCurrency(calculations.totalInterest)}
                  </p>
                </div>
                <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Effective APR</p>
                  <p className="text-lg font-bold font-mono text-destructive">
                    {calculations.effectiveAPR.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Daily Interest */}
              <div className="flex items-center justify-between p-3 rounded-sm bg-primary/5 border border-primary/20">
                <span className="text-sm text-muted-foreground">Daily Interest</span>
                <span className="text-sm font-bold font-mono text-primary">
                  {formatCurrency(calculations.dailyInterest)} / day
                </span>
              </div>

              {/* Total Loan Cost Breakdown */}
              <div className="p-4 rounded-sm bg-muted/50 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Total Loan Cost</span>
                  <span className="text-xl font-bold font-mono text-foreground">
                    {formatCurrency(calculations.totalLoanCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Points: {formatCurrency(calculations.pointsCost)}</span>
                  <span>Interest: {formatCurrency(calculations.totalInterest)}</span>
                  <span>Closing: {formatCurrency(closingCosts)}</span>
                </div>
              </div>

              {/* Rate Sensitivity Table */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Rate Sensitivity
                </h4>
                <div className="rounded-sm border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Rate</th>
                        <th className="text-right p-2 font-medium">Interest</th>
                        <th className="text-right p-2 font-medium">Est. Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateSensitivity.map((row, idx) => (
                        <tr 
                          key={row.rate} 
                          className={cn(
                            "border-t border-border",
                            idx === 0 && "bg-primary/5"
                          )}
                        >
                          <td className="p-2 font-mono">
                            {row.rate.toFixed(1)}%
                            {idx === 0 && <span className="text-xs text-primary ml-1">(current)</span>}
                          </td>
                          <td className="p-2 text-right font-mono">{formatCurrency(row.interest)}</td>
                          <td className={cn(
                            "p-2 text-right font-mono",
                            row.profit >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {formatCurrency(row.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payoff Timeline */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Payoff Timeline
                </h4>
                <div className="space-y-2">
                  {payoffComparison.map((row) => (
                    <div 
                      key={row.months} 
                      className={cn(
                        "flex items-center justify-between p-2 rounded-sm border",
                        row.isCurrent 
                          ? "bg-primary/10 border-primary/30" 
                          : row.months < loanTermMonths
                            ? "bg-success/5 border-success/20"
                            : "bg-muted/50 border-border"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          If sold at <span className="font-mono font-medium">{row.months % 1 !== 0 ? row.months.toFixed(1) : row.months} mo</span>:
                          {row.isCurrent && row.months % 1 !== 0 && (
                            <span className="text-xs text-primary ml-1">(current)</span>
                          )}
                        </span>
                      </div>
                      <span className="font-mono text-sm">{formatCurrency(row.interest)} int</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Preset Dialog */}
      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Loan Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., My Lender Standard Terms"
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Interest Rate:</strong> {interestRate}%</p>
              <p><strong>Term:</strong> {loanTermMonths} months</p>
              <p><strong>Points:</strong> {points}%</p>
              <p><strong>Type:</strong> {interestOnly ? 'Interest Only' : 'Amortizing'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePreset} disabled={savingPreset}>
              {savingPreset ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Preset Dialog */}
      <Dialog open={editPresetOpen} onOpenChange={setEditPresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Loan Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-preset-name">Preset Name</Label>
              <Input
                id="edit-preset-name"
                value={editPresetName}
                onChange={(e) => setEditPresetName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-interest-rate">Interest Rate (%)</Label>
                <Input
                  id="edit-interest-rate"
                  type="number"
                  value={editInterestRate}
                  onChange={(e) => setEditInterestRate(Number(e.target.value))}
                  step={0.01}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-term">Term (Months)</Label>
                <Input
                  id="edit-term"
                  type="number"
                  value={editLoanTermMonths}
                  onChange={(e) => setEditLoanTermMonths(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-points">Points (%)</Label>
                <Input
                  id="edit-points"
                  type="number"
                  value={editPoints}
                  onChange={(e) => setEditPoints(Number(e.target.value))}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-closing">Closing Costs (%)</Label>
                <Input
                  id="edit-closing"
                  type="number"
                  value={editClosingCostsPercent}
                  onChange={(e) => setEditClosingCostsPercent(Number(e.target.value))}
                  step={0.5}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-sm bg-muted/50">
              <Label htmlFor="edit-interest-only">Interest Only</Label>
              <Switch
                id="edit-interest-only"
                checked={editInterestOnly}
                onCheckedChange={setEditInterestOnly}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPresetOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePreset} disabled={updatingPreset}>
              {updatingPreset ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Update Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletePresetOpen} onOpenChange={setDeletePresetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingPreset && handleDeletePreset(deletingPreset)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

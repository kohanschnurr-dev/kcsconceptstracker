import { useState, useRef } from 'react';
import { Camera, DollarSign, X, Upload, Loader2, FileText, Sparkles } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ALL_CATEGORIES, BUDGET_CATEGORIES, TEXAS_SALES_TAX, Project, PaymentMethod, BudgetCategory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuickExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onExpenseCreated?: () => void;
}

function ExpenseForm({ 
  projects, 
  onExpenseCreated, 
  onClose 
}: { 
  projects: Project[]; 
  onExpenseCreated?: () => void;
  onClose: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [includeTax, setIncludeTax] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Text parsing state
  const [showTextInput, setShowTextInput] = useState(false);
  const [receiptText, setReceiptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const calculateTax = () => {
    const baseAmount = parseFloat(amount) || 0;
    return baseAmount * TEXAS_SALES_TAX;
  };

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    return includeTax ? baseAmount + calculateTax() : baseAmount;
  };

  const handleParseReceiptText = async () => {
    if (!receiptText.trim()) {
      toast({
        title: 'No text provided',
        description: 'Please paste receipt text to parse.',
        variant: 'destructive',
      });
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-receipt-text', {
        body: { receiptText: receiptText.trim() }
      });

      if (error) throw error;

      if (data?.data) {
        const parsed = data.data;
        
        if (parsed.vendor) setVendor(parsed.vendor);
        if (parsed.date) setDate(parsed.date);
        if (parsed.amount) setAmount(parsed.amount.toString());
        if (parsed.description) setDescription(parsed.description);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod as PaymentMethod);
        if (parsed.includesTax !== undefined) setIncludeTax(parsed.includesTax);

        toast({
          title: 'Receipt parsed',
          description: 'Expense details extracted successfully.',
        });
        
        setShowTextInput(false);
        setReceiptText('');
      }
    } catch (error: any) {
      console.error('Error parsing receipt:', error);
      toast({
        title: 'Parse failed',
        description: error.message || 'Could not parse receipt text.',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;
    
    setIsUploading(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload receipt image.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !selectedCategory || !amount || !vendor) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, find or create the project_category
      const { data: existingCategory, error: fetchError } = await supabase
        .from('project_categories')
        .select('id')
        .eq('project_id', selectedProject)
        .eq('category', selectedCategory as BudgetCategory)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let categoryId = existingCategory?.id;

      // If category doesn't exist for this project, create it
      if (!categoryId) {
        const { data: newCategory, error: createError } = await supabase
          .from('project_categories')
          .insert({
            project_id: selectedProject,
            category: selectedCategory as BudgetCategory,
            estimated_budget: 0,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        categoryId = newCategory.id;
      }

      const receiptUrl = await uploadReceipt();

      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: selectedProject,
          category_id: categoryId,
          amount: calculateTotal(),
          vendor_name: vendor,
          description: description || null,
          payment_method: paymentMethod,
          status: 'actual',
          includes_tax: includeTax,
          tax_amount: includeTax ? calculateTax() : null,
          date: date,
          receipt_url: receiptUrl,
        });

      if (error) throw error;

      toast({
        title: 'Expense logged',
        description: `$${calculateTotal().toFixed(2)} added successfully`,
      });

      onClose();
      onExpenseCreated?.();
    } catch (error: any) {
      console.error('Error creating expense:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to log expense.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {/* Text-to-Info Feature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Quick Import</Label>
          <Button
            type="button"
            variant={showTextInput ? "secondary" : "outline"}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowTextInput(!showTextInput)}
          >
            <FileText className="h-3 w-3" />
            Paste Receipt Text
          </Button>
        </div>
        
        {showTextInput && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Textarea
              placeholder="Paste receipt text here (from email, screenshot OCR, etc.)..."
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              rows={6}
              className="text-xs font-mono"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="gap-1.5 flex-1"
                onClick={handleParseReceiptText}
                disabled={isParsing || !receiptText.trim()}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    Extract Details
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTextInput(false);
                  setReceiptText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.filter(p => p.status === 'active').map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9 font-mono text-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vendor</Label>
          <Input
            placeholder="Home Depot, contractor..."
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Payment</Label>
          <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea
          placeholder="What was purchased?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Switch
            id="tax"
            checked={includeTax}
            onCheckedChange={setIncludeTax}
          />
          <Label htmlFor="tax" className="text-sm cursor-pointer">
            Add TX Sales Tax (8.25%)
          </Label>
        </div>
        {includeTax && amount && (
          <span className="text-sm font-mono text-muted-foreground">
            +${calculateTax().toFixed(2)}
          </span>
        )}
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label>Receipt (optional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        {receiptPreview ? (
          <div className="relative">
            <img 
              src={receiptPreview} 
              alt="Receipt preview" 
              className="w-full h-32 object-cover rounded-lg border border-border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => {
                setReceiptFile(null);
                setReceiptPreview(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            Add Receipt Photo
          </Button>
        )}
      </div>

      {amount && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium">Total</span>
          <span className="text-xl font-mono font-semibold text-primary">
            ${calculateTotal().toFixed(2)}
          </span>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isSubmitting || isUploading}
      >
        {isSubmitting || isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isUploading ? 'Uploading...' : 'Saving...'}
          </>
        ) : (
          'Log Expense'
        )}
      </Button>
    </form>
  );
}

export function QuickExpenseModal({ open, onOpenChange, projects, onExpenseCreated }: QuickExpenseModalProps) {
  const isMobile = useIsMobile();

  const handleClose = () => onOpenChange(false);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Quick Log Expense
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <ExpenseForm 
              projects={projects} 
              onExpenseCreated={onExpenseCreated}
              onClose={handleClose}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Quick Log Expense
          </DialogTitle>
        </DialogHeader>
        <ExpenseForm 
          projects={projects} 
          onExpenseCreated={onExpenseCreated}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}

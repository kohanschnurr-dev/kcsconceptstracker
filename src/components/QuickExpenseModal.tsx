import { useState } from 'react';
import { Camera, DollarSign, X } from 'lucide-react';
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
import { BUDGET_CATEGORIES, TEXAS_SALES_TAX, Project, PaymentMethod } from '@/types';
import { toast } from '@/hooks/use-toast';

interface QuickExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
}

export function QuickExpenseModal({ open, onOpenChange, projects }: QuickExpenseModalProps) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [includeTax, setIncludeTax] = useState(false);

  const calculateTax = () => {
    const baseAmount = parseFloat(amount) || 0;
    return baseAmount * TEXAS_SALES_TAX;
  };

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    return includeTax ? baseAmount + calculateTax() : baseAmount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !selectedCategory || !amount || !vendor) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    // In a real app, this would save to the database
    toast({
      title: 'Expense logged',
      description: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculateTotal())} added to ${BUDGET_CATEGORIES.find(c => c.value === selectedCategory)?.label}`,
    });

    // Reset form
    setSelectedProject('');
    setSelectedCategory('');
    setAmount('');
    setVendor('');
    setDescription('');
    setPaymentMethod('card');
    setIncludeTax(false);
    onOpenChange(false);
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Quick Log Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9 font-mono"
                />
              </div>
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
            <Label>Vendor</Label>
            <Input
              placeholder="Home Depot, contractor name..."
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
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

          {amount && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-medium">Total</span>
              <span className="text-xl font-mono font-semibold text-primary">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 gap-2">
              <Camera className="h-4 w-4" />
              Add Receipt
            </Button>
            <Button type="submit" className="flex-1">
              Log Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Users, Phone, Mail, Star } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { BUDGET_CATEGORIES, type BudgetCategory } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface NewVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorCreated?: () => void;
}

export function NewVendorModal({ open, onOpenChange, onVendorCreated }: NewVendorModalProps) {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hasW9, setHasW9] = useState(false);
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [reliabilityRating, setReliabilityRating] = useState(3);
  const [pricingModel, setPricingModel] = useState<'flat' | 'hourly'>('flat');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !trade) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in name and trade.',
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
          description: 'You must be logged in to add a vendor.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('vendors')
        .insert({
          name,
          trade: trade as BudgetCategory,
          phone: phone || null,
          email: email || null,
          has_w9: hasW9,
          insurance_expiry: insuranceExpiry || null,
          reliability_rating: reliabilityRating,
          pricing_model: pricingModel,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Vendor added!',
        description: `${name} has been added to your vendors.`,
      });

      // Reset form
      setName('');
      setTrade('');
      setPhone('');
      setEmail('');
      setHasW9(false);
      setInsuranceExpiry('');
      setReliabilityRating(3);
      setPricingModel('flat');
      onOpenChange(false);
      onVendorCreated?.();
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add vendor.',
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
            <Users className="h-5 w-5 text-primary" />
            Add Vendor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Vendor Name *</Label>
            <Input
              placeholder="DFW Foundation Pros..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Trade *</Label>
            <Select value={trade} onValueChange={setTrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select trade" />
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
              <Label>Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="(214) 555-0101"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="info@vendor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pricing Model</Label>
              <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as 'flat' | 'hourly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Insurance Expiry</Label>
              <Input
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reliability Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setReliabilityRating(rating)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      rating <= reliabilityRating
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground/30 hover:text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label htmlFor="w9" className="text-sm cursor-pointer">
              W9 on file
            </Label>
            <Switch
              id="w9"
              checked={hasW9}
              onCheckedChange={setHasW9}
            />
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
              {isSubmitting ? 'Adding...' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

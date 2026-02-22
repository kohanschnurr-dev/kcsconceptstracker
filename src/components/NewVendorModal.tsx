import { useState, useEffect } from 'react';
import { Users, Phone, Mail, Star, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { getVendorTrades, type VendorTrade } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  trades: string[];
  phone: string | null;
  email: string | null;
  has_w9: boolean;
  reliability_rating: number | null;
  pricing_model: 'flat' | 'hourly' | null;
  notes: string | null;
}

interface NewVendorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorCreated?: () => void;
  vendor?: Vendor | null;
}

export function NewVendorModal({ open, onOpenChange, onVendorCreated, vendor }: NewVendorModalProps) {
  const [name, setName] = useState('');
  const [trades, setTrades] = useState<VendorTrade[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hasW9, setHasW9] = useState(false);
  const [reliabilityRating, setReliabilityRating] = useState(3);
  const [pricingModel, setPricingModel] = useState<'flat' | 'hourly'>('flat');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!vendor;

  // Populate form when editing
  useEffect(() => {
    if (open && vendor) {
      setName(vendor.name);
      setTrades(vendor.trades as VendorTrade[]);
      setPhone(vendor.phone || '');
      setEmail(vendor.email || '');
      setHasW9(vendor.has_w9);
      setReliabilityRating(vendor.reliability_rating || 3);
      setPricingModel(vendor.pricing_model || 'flat');
      setNotes(vendor.notes || '');
    } else if (!open) {
      // Reset form when closing
      setName('');
      setTrades([]);
      setPhone('');
      setEmail('');
      setHasW9(false);
      setReliabilityRating(3);
      setPricingModel('flat');
      setNotes('');
    }
  }, [open, vendor]);

  const handleAddTrade = (trade: string) => {
    if (trade && !trades.includes(trade as VendorTrade)) {
      setTrades([...trades, trade as VendorTrade]);
    }
  };

  const handleRemoveTrade = (trade: VendorTrade) => {
    setTrades(trades.filter(t => t !== trade));
  };

  const getTradeLabel = (trade: string) => {
    return getVendorTrades().find(t => t.value === trade)?.label || trade;
  };

  const availableTrades = getVendorTrades().filter(t => !trades.includes(t.value));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || trades.length === 0) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in name and select at least one trade.',
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
          description: 'You must be logged in to manage contractors.',
          variant: 'destructive',
        });
        return;
      }

      if (isEditing) {
        // Update existing vendor
        const { error } = await supabase
          .from('vendors')
          .update({
            name,
            trades: trades,
            phone: phone || null,
            email: email || null,
            has_w9: hasW9,
            reliability_rating: reliabilityRating,
            pricing_model: pricingModel,
            notes: notes || null,
          })
          .eq('id', vendor.id);

        if (error) throw error;

        toast({
          title: 'Contractor updated!',
          description: `${name} has been updated.`,
        });
      } else {
        // Create new vendor
        const { error } = await supabase
          .from('vendors')
          .insert({
            name,
            trades: trades,
            phone: phone || null,
            email: email || null,
            has_w9: hasW9,
            reliability_rating: reliabilityRating,
            pricing_model: pricingModel,
            notes: notes || null,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: 'Contractor added!',
          description: `${name} has been added to your contractors.`,
        });
      }

      onOpenChange(false);
      onVendorCreated?.();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save contractor.',
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
            {isEditing ? 'Edit Contractor' : 'Add Contractor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Contractor Name *</Label>
            <Input
              placeholder="DFW Foundation Pros..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Trades *</Label>
            <Select onValueChange={handleAddTrade} value="">
              <SelectTrigger>
                <SelectValue placeholder="Add a trade" />
              </SelectTrigger>
              <SelectContent>
                {availableTrades.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {trades.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {trades.map((trade) => (
                  <Badge 
                    key={trade} 
                    variant="secondary" 
                    className="gap-1 pr-1"
                  >
                    {getTradeLabel(trade)}
                    <button
                      type="button"
                      onClick={() => handleRemoveTrade(trade)}
                      className="ml-1 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {trades.length === 0 && (
              <p className="text-xs text-muted-foreground">Select one or more trades</p>
            )}
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

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="General notes about this contractor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
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
              {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Contractor')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

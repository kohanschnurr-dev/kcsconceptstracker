import { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Star, CheckCircle, XCircle, AlertTriangle, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NewVendorModal } from '@/components/NewVendorModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BUDGET_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  has_w9: boolean;
  insurance_expiry: string | null;
  reliability_rating: number | null;
  pricing_model: 'flat' | 'hourly' | null;
}

export default function Vendors() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(search.toLowerCase()) ||
    vendor.trade.toLowerCase().includes(search.toLowerCase())
  );

  const isInsuranceExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isInsuranceExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTradeLabel = (trade: string) => {
    return BUDGET_CATEGORIES.find(b => b.value === trade)?.label || trade;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Vendors</h1>
            <p className="text-muted-foreground mt-1">Manage your DFW contractors</p>
          </div>
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Vendors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => {
                const expired = isInsuranceExpired(vendor.insurance_expiry);
                const expiringSoon = isInsuranceExpiringSoon(vendor.insurance_expiry);
                const hasComplianceIssues = expired || !vendor.has_w9;

                return (
                  <div
                    key={vendor.id}
                    className={cn(
                      'glass-card p-5 hover:border-primary/50 transition-all cursor-pointer animate-slide-up',
                      hasComplianceIssues && 'border-destructive/30'
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{vendor.name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {getTradeLabel(vendor.trade)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-4 w-4',
                              i < (vendor.reliability_rating || 0)
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {vendor.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Badge variant="outline" className="text-xs">
                        {vendor.pricing_model === 'flat' ? 'Flat Rate' : vendor.pricing_model === 'hourly' ? 'Hourly' : 'Not set'}
                      </Badge>
                    </div>

                    {/* Compliance Status */}
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">W9 on file</span>
                        {vendor.has_w9 ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Insurance</span>
                        <div className="flex items-center gap-2">
                          {expired ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : expiringSoon ? (
                            <AlertTriangle className="h-5 w-5 text-warning" />
                          ) : vendor.insurance_expiry ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className={cn(
                            'text-xs',
                            expired && 'text-destructive',
                            expiringSoon && 'text-warning'
                          )}>
                            {formatDate(vendor.insurance_expiry)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {hasComplianceIssues && (
                      <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs text-destructive font-medium">
                          ⚠️ Resolve compliance issues before payment
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredVendors.length === 0 && (
              <div className="text-center py-12 glass-card">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">
                  {vendors.length === 0 ? 'No vendors yet' : 'No vendors match your search'}
                </p>
                {vendors.length === 0 && (
                  <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Your First Vendor
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <NewVendorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onVendorCreated={fetchVendors}
      />
    </MainLayout>
  );
}

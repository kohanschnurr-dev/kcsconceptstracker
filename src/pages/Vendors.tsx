import { useState } from 'react';
import { Plus, Search, Phone, Mail, Star, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockVendors } from '@/data/mockData';
import { BUDGET_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';

export default function Vendors() {
  const [search, setSearch] = useState('');

  const filteredVendors = mockVendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(search.toLowerCase()) ||
    vendor.trade.toLowerCase().includes(search.toLowerCase())
  );

  const isInsuranceExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isInsuranceExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const formatDate = (date: string) => {
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
          <Button className="gap-2">
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

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => {
            const expired = isInsuranceExpired(vendor.insuranceExpiry);
            const expiringSoon = isInsuranceExpiringSoon(vendor.insuranceExpiry);
            const hasComplianceIssues = expired || !vendor.hasW9;

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
                          i < vendor.reliabilityRating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Badge variant="outline" className="text-xs">
                    {vendor.pricingModel === 'flat' ? 'Flat Rate' : 'Hourly'}
                  </Badge>
                </div>

                {/* Compliance Status */}
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">W9 on file</span>
                    {vendor.hasW9 ? (
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
                      ) : (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                      <span className={cn(
                        'text-xs',
                        expired && 'text-destructive',
                        expiringSoon && 'text-warning'
                      )}>
                        {formatDate(vendor.insuranceExpiry)}
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">No vendors found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

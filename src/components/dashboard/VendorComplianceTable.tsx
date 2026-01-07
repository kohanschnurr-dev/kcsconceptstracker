import { CheckCircle, XCircle, AlertTriangle, Star } from 'lucide-react';
import { Vendor, BUDGET_CATEGORIES } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VendorComplianceTableProps {
  vendors: Vendor[];
}

export function VendorComplianceTable({ vendors }: VendorComplianceTableProps) {
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
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold">Vendor Compliance</h3>
        <p className="text-sm text-muted-foreground mt-1">W9 and insurance status</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th>Vendor</th>
              <th>Trade</th>
              <th>Rating</th>
              <th>W9</th>
              <th>Insurance</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              const expired = isInsuranceExpired(vendor.insuranceExpiry);
              const expiringSoon = isInsuranceExpiringSoon(vendor.insuranceExpiry);
              
              return (
                <tr key={vendor.id} className="hover:bg-muted/20 transition-colors">
                  <td>
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.phone}</p>
                    </div>
                  </td>
                  <td>
                    <Badge variant="secondary" className="text-xs">
                      {getTradeLabel(vendor.trade)}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3.5 w-3.5',
                            i < vendor.reliabilityRating
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      ))}
                    </div>
                  </td>
                  <td>
                    {vendor.hasW9 ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </td>
                  <td>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

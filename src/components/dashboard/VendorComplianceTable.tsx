import { CheckCircle, XCircle, Star } from 'lucide-react';
import { Vendor, getBudgetCategories } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VendorComplianceTableProps {
  vendors: Vendor[];
}

export function VendorComplianceTable({ vendors }: VendorComplianceTableProps) {
  const getTradeLabel = (trade: string) => {
    return getBudgetCategories().find(b => b.value === trade)?.label || trade;
  };

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold">Contractor Compliance</h3>
        <p className="text-sm text-muted-foreground mt-1">W9 status for contractors</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th>Contractor</th>
              <th>Trades</th>
              <th>Rating</th>
              <th>W9</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-muted/20 transition-colors">
                <td>
                  <div>
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.phone}</p>
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {vendor.trades.slice(0, 2).map((trade) => (
                      <Badge key={trade} variant="secondary" className="text-xs">
                        {getTradeLabel(trade)}
                      </Badge>
                    ))}
                    {vendor.trades.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{vendor.trades.length - 2}
                      </Badge>
                    )}
                    {vendor.trades.length === 0 && (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

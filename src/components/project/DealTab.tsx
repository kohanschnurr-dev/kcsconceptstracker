import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Calculator, FileCheck } from 'lucide-react';

export function DealTab({ projectId }: { projectId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Assignment fee, buyer info, contract dates, earnest money tracking, and closing timeline. Coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Deal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ARV comps, repair estimates, MAO calculation, and profit projections for the deal. Coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Contract Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track contract milestones — inspection period, title search, buyer financing, and closing checklist. Coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

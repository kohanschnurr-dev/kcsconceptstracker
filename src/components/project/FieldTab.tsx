import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardHat, Users, ClipboardCheck } from 'lucide-react';

export function FieldTab({ projectId }: { projectId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Crew & Labor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track crew members on site, labor hours, and daily headcounts. Coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" />
            Subcontractors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Subcontractor directory with contact info, trade, status, and scheduling. Coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Permits & Inspections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track permit applications, inspection dates, and pass/fail results. Coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

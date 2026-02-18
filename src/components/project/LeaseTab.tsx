import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, CalendarDays } from 'lucide-react';

export function LeaseTab({ projectId }: { projectId: string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lease Terms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Lease start/end dates, rent amount, security deposit, escalation clauses, and renewal options. Coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Tenant Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tenant contact details, screening status, move-in/move-out dates, and communication log. Coming soon.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Rent Roll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payment history, late fees, and rent collection tracking. Coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Plus, Search, Calendar, Users, Camera, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockDailyLogs, mockProjects, mockVendors } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function DailyLogs() {
  const [search, setSearch] = useState('');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProjectName = (projectId: string) => {
    return mockProjects.find(p => p.id === projectId)?.name || projectId;
  };

  const getVendorNames = (vendorIds: string[]) => {
    return vendorIds.map(id => mockVendors.find(v => v.id === id)?.name || id);
  };

  const filteredLogs = mockDailyLogs.filter((log) =>
    log.workPerformed.toLowerCase().includes(search.toLowerCase()) ||
    log.issues.toLowerCase().includes(search.toLowerCase()) ||
    getProjectName(log.projectId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Daily Logs</h1>
            <p className="text-muted-foreground mt-1">Track site visits and progress</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Log Entry
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Logs Timeline */}
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const vendorNames = getVendorNames(log.contractorsOnSite);
            const hasIssues = log.issues.trim().length > 0;

            return (
              <div
                key={log.id}
                className="glass-card p-5 hover:border-primary/50 transition-all cursor-pointer animate-slide-up"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(log.date)}</span>
                    </div>
                    <h3 className="font-semibold">{getProjectName(log.projectId)}</h3>
                  </div>
                  {hasIssues && (
                    <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Issue Reported
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Contractors on site */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Users className="h-4 w-4" />
                      <span>Contractors On-Site</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vendorNames.map((name, i) => (
                        <Badge key={i} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Work Performed */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Work Performed</p>
                    <p className="text-sm">{log.workPerformed}</p>
                  </div>

                  {/* Issues */}
                  {hasIssues && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-sm text-muted-foreground mb-1">Issues Encountered</p>
                      <p className="text-sm text-warning">{log.issues}</p>
                    </div>
                  )}

                  {/* Photos */}
                  {log.photoUrls.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Camera className="h-4 w-4" />
                        <span>{log.photoUrls.length} photos</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 glass-card">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No daily logs yet</p>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Log
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

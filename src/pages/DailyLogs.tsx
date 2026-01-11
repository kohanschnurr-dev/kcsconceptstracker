import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Users, Camera, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NewDailyLogModal } from '@/components/NewDailyLogModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyLog {
  id: string;
  project_id: string;
  date: string;
  work_performed: string | null;
  issues: string | null;
  photo_urls: string[];
  projects?: {
    name: string;
  };
}

export default function DailyLogs() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select(`
          *,
          projects (name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load daily logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredLogs = logs.filter((log) =>
    (log.work_performed?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.issues?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.projects?.name?.toLowerCase() || '').includes(search.toLowerCase())
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
          <Button className="gap-2" onClick={() => setModalOpen(true)}>
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

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Logs Timeline */}
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const hasIssues = (log.issues?.trim().length || 0) > 0;

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
                        <h3 className="font-semibold">{log.projects?.name || 'Unknown Project'}</h3>
                      </div>
                      {hasIssues && (
                        <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Issue Reported
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Work Performed */}
                      {log.work_performed && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Work Performed</p>
                          <p className="text-sm">{log.work_performed}</p>
                        </div>
                      )}

                      {/* Issues */}
                      {hasIssues && (
                        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                          <p className="text-sm text-muted-foreground mb-1">Issues Encountered</p>
                          <p className="text-sm text-warning">{log.issues}</p>
                        </div>
                      )}

                      {/* Photos */}
                      {log.photo_urls && log.photo_urls.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Camera className="h-4 w-4" />
                            <span>{log.photo_urls.length} photos</span>
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
                <p className="text-muted-foreground mb-4">
                  {logs.length === 0 ? 'No daily logs yet' : 'No logs match your search'}
                </p>
                {logs.length === 0 && (
                  <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Log
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <NewDailyLogModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onLogCreated={fetchLogs}
      />
    </MainLayout>
  );
}

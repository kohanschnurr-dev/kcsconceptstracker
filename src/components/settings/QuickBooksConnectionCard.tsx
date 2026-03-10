import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Link2Off, Loader2, RefreshCw } from 'lucide-react';
import { useQuickBooks } from '@/hooks/useQuickBooks';

export default function QuickBooksConnectionCard() {
  const {
    isConnected,
    isDemoMode,
    isLoading,
    connect,
    disconnect,
    enableDemoMode,
  } = useQuickBooks();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              QuickBooks Integration
            </CardTitle>
            <CardDescription>Connect your QuickBooks account to import expenses</CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isDemoMode ? "Demo Mode" : isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Link your QuickBooks Online account to automatically sync and import your expenses.
              Your credentials are securely stored and encrypted.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={connect} className="gap-2">
                <Link2 className="h-4 w-4" />
                Connect QuickBooks
              </Button>
              <Button variant="outline" onClick={enableDemoMode} className="gap-2">
                Try Demo Mode
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDemoMode ? 'Demo mode is active' : 'QuickBooks account connected'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isDemoMode
                    ? 'Using sample data for testing. Go to Expenses to view.'
                    : 'Expenses will sync automatically. Go to Expenses to manage imports.'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={disconnect}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
            >
              <Link2Off className="h-4 w-4" />
              {isDemoMode ? 'Exit Demo Mode' : 'Disconnect QuickBooks'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

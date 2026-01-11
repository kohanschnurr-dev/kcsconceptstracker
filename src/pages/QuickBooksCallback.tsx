import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuickBooksCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const realmId = searchParams.get('realmId');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setStatus('error');
        setError(searchParams.get('error_description') || 'Authorization was denied');
        return;
      }

      if (!code || !realmId) {
        setStatus('error');
        setError('Missing authorization code or company ID');
        return;
      }

      try {
        // Call the edge function to complete the OAuth flow
        const { error: fnError } = await supabase.functions.invoke(
          `quickbooks-auth?action=callback&code=${encodeURIComponent(code)}&realmId=${encodeURIComponent(realmId)}`
        );

        if (fnError) {
          throw new Error(fnError.message);
        }

        setStatus('success');

        // If opened as popup, notify parent window
        if (window.opener) {
          window.opener.postMessage({ type: 'quickbooks-callback', success: true }, '*');
          setTimeout(() => window.close(), 2000);
        } else {
          // If not a popup, redirect to expenses page
          setTimeout(() => navigate('/expenses'), 2000);
        }
      } catch (err: any) {
        console.error('QuickBooks callback error:', err);
        setStatus('error');
        setError(err.message || 'Failed to complete authorization');

        if (window.opener) {
          window.opener.postMessage({ 
            type: 'quickbooks-callback', 
            success: false, 
            error: err.message 
          }, '*');
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass-card p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connecting to QuickBooks...</h2>
            <p className="text-muted-foreground">Please wait while we complete the authorization.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connected Successfully!</h2>
            <p className="text-muted-foreground mb-4">
              Your QuickBooks account has been connected. You can now sync your expenses.
            </p>
            {!window.opener && (
              <Button onClick={() => navigate('/expenses')}>
                Go to Expenses
              </Button>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.close()}>
                Close
              </Button>
              <Button onClick={() => navigate('/expenses')}>
                Back to Expenses
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

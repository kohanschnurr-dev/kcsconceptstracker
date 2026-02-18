import { useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useIsPM } from '@/hooks/useIsPM';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function MessageOwnerButton() {
  const { isPM, teamId, isLoading } = useIsPM();
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (isLoading || !isPM) return null;

  const handleSend = async () => {
    if (!message.trim() || !teamId || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('owner_messages')
        .insert({
          team_id: teamId,
          sender_id: user.id,
          message: message.trim(),
        });

      if (error) throw error;

      toast({
        title: 'Message sent',
        description: 'Your message has been sent to the owner.',
      });
      setMessage('');
      setOpen(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      toast({
        title: 'Failed to send',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-4 w-4" />
        Message Owner
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!sending) setOpen(v); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message Owner</DialogTitle>
          </DialogHeader>

          <Textarea
            placeholder="Type your message to the owner…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={sending}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending…
                </>
              ) : (
                'Send'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

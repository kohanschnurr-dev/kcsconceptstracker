import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useIsPM } from '@/hooks/useIsPM';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageThread } from '@/hooks/useMessageThread';

export function MessageOwnerButton() {
  const { isPM, teamId, isLoading } = useIsPM();
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading: threadLoading, isSending, fetchPmThread, sendMessage } = useMessageThread({
    teamId: null,
    pmId: null,
  });

  // Fetch thread when dialog opens
  useEffect(() => {
    if (open && teamId) {
      fetchPmThread(teamId);
    }
  }, [open, teamId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (isLoading || !isPM) return null;

  const handleSend = async () => {
    if (!draft.trim() || !teamId || isSending) return;
    const ok = await sendMessage(draft, teamId);
    if (ok) setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
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

      <Dialog open={open} onOpenChange={(v) => { if (!isSending) setOpen(v); }}>
        <DialogContent className="sm:max-w-md flex flex-col" style={{ maxHeight: '80vh' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Message Owner
            </DialogTitle>
          </DialogHeader>

          {/* Thread messages */}
          <ScrollArea className="flex-1 min-h-0 max-h-[40vh] border rounded-lg bg-muted/30 px-3 py-2">
            {threadLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading conversation…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm text-center">
                No messages yet. Send one below.
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-1">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === user?.id;
                  const timeAgo = formatDistanceToNow(new Date(msg.created_at), { addSuffix: true });

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}
                    >
                      <span className="text-xs text-muted-foreground px-1">
                        {isMe ? 'You' : 'Owner'}
                      </span>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-background border border-border text-foreground rounded-tl-sm'
                        )}
                      >
                        {msg.message}
                      </div>
                      <span className="text-xs text-muted-foreground/70 px-1">{timeAgo}</span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="flex flex-col gap-2 pt-2">
            <Textarea
              placeholder="Type your message… (⌘↵ to send)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none text-sm"
              disabled={isSending}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSending}
              >
                Close
              </Button>
              <Button
                onClick={handleSend}
                disabled={!draft.trim() || isSending}
                className="gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

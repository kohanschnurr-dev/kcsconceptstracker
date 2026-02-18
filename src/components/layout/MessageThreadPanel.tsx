import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageThread } from '@/hooks/useMessageThread';

interface MessageThreadPanelProps {
  pmId: string;
  pmName: string;
  teamId: string;
  onBack: () => void;
}

export function MessageThreadPanel({ pmId, pmName, teamId, onBack }: MessageThreadPanelProps) {
  const { user } = useAuth();
  const { messages, isLoading, isSending, sendReply } = useMessageThread({ teamId, pmId });
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || isSending) return;
    const ok = await sendReply(draft);
    if (ok) setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">{pmName}</span>
          <span className="text-xs text-muted-foreground">Project Manager</span>
        </div>
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading conversation…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm text-center px-4">
            No messages yet. Start the conversation below.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isOwner = msg.sender_id === user?.id;
              const timeAgo = formatDistanceToNow(new Date(msg.created_at), { addSuffix: true });

              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col gap-1', isOwner ? 'items-end' : 'items-start')}
                >
                  <span className="text-xs text-muted-foreground px-1">
                    {isOwner ? 'You' : pmName}
                  </span>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
                      isOwner
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
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

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-border p-3 flex flex-col gap-2">
        <Textarea
          placeholder="Type a reply… (⌘↵ to send)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          className="min-h-[72px] resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}

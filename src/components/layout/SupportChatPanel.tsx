import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Lightbulb, MessageSquare, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSupportMessages } from '@/hooks/useSupportMessages';
import { useToast } from '@/hooks/use-toast';

type SupportSubTab = 'chat' | 'feature_request';

export function SupportChatPanel() {
  const { chatMessages, featureRequests, isLoading, isSending, sendMessage, submitFeatureRequest } =
    useSupportMessages();
  const { toast } = useToast();

  const [subTab, setSubTab] = useState<SupportSubTab>('chat');
  const [chatDraft, setChatDraft] = useState('');
  const [frSubject, setFrSubject] = useState('');
  const [frDescription, setFrDescription] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async () => {
    if (!chatDraft.trim() || isSending) return;
    const ok = await sendMessage(chatDraft);
    if (ok) setChatDraft('');
  };

  const handleSubmitFeatureRequest = async () => {
    if (!frSubject.trim() || !frDescription.trim() || isSending) return;
    const ok = await submitFeatureRequest(frSubject, frDescription);
    if (ok) {
      setFrSubject('');
      setFrDescription('');
      toast({ title: 'Feature request submitted!', description: 'We\'ll review your request soon.' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex border-b border-border flex-shrink-0 px-2 pt-2 gap-1">
        <button
          onClick={() => setSubTab('chat')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors',
            subTab === 'chat'
              ? 'bg-muted text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageSquare className="h-3 w-3" />
          Chat
        </button>
        <button
          onClick={() => setSubTab('feature_request')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-medium transition-colors',
            subTab === 'feature_request'
              ? 'bg-muted text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Lightbulb className="h-3 w-3" />
          Feature Request
        </button>
      </div>

      {/* Chat sub-tab */}
      {subTab === 'chat' && (
        <>
          <ScrollArea className="flex-1 px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading…
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm text-center px-4 gap-2">
                <MessageSquare className="h-8 w-8 opacity-30" />
                <p className="font-medium">No messages yet</p>
                <p className="text-xs">Send a message and our support team will reply shortly.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chatMessages.map((msg) => {
                  const isUser = msg.sender_role === 'user';
                  return (
                    <div key={msg.id} className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
                      <span className="text-xs text-muted-foreground px-1">
                        {isUser ? 'You' : 'KCS Support'}
                      </span>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm'
                        )}
                      >
                        {msg.message}
                      </div>
                      <span className="text-xs text-muted-foreground/70 px-1">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </ScrollArea>

          <div className="flex-shrink-0 border-t border-border p-3 flex flex-col gap-2">
            <Textarea
              placeholder="Message support… (⌘↵ to send)"
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              disabled={isSending}
              className="min-h-[56px] resize-none text-sm"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSendChat}
                disabled={!chatDraft.trim() || isSending}
                className="gap-2"
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {isSending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Feature Request sub-tab */}
      {subTab === 'feature_request' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Submission form */}
          <div className="flex-shrink-0 p-4 border-b border-border flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Suggest a new feature or software improvement. We read every request!
            </p>
            <Input
              placeholder="Subject (e.g. 'Bulk expense import')"
              value={frSubject}
              onChange={(e) => setFrSubject(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="Describe your feature request…"
              value={frDescription}
              onChange={(e) => setFrDescription(e.target.value)}
              className="min-h-[72px] resize-none text-sm"
            />
            <Button
              size="sm"
              onClick={handleSubmitFeatureRequest}
              disabled={!frSubject.trim() || !frDescription.trim() || isSending}
              className="self-end gap-2"
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
              {isSending ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>

          {/* Past requests list */}
          <ScrollArea className="flex-1 px-4 py-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading…
              </div>
            ) : featureRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm text-center px-4 gap-1">
                <Lightbulb className="h-6 w-6 opacity-30" />
                <p className="text-xs">No requests submitted yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {featureRequests.map((req) => (
                  <div key={req.id} className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground leading-snug">{req.subject}</span>
                      <Badge variant="secondary" className="flex-shrink-0 flex items-center gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        Submitted
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{req.message}</p>
                    <span className="text-xs text-muted-foreground/60">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

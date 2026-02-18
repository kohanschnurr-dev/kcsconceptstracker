import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsPM } from '@/hooks/useIsPM';
import { useTeam } from '@/hooks/useTeam';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import { useMessageThread } from '@/hooks/useMessageThread';
import { MessageThreadPanel } from './MessageThreadPanel';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';

// ─── PM Thread View (inline for PM users) ───────────────────────────────────

function PmThreadView({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const { messages, isLoading, isSending, sendMessage, fetchPmThread } = useMessageThread({
    teamId,
    pmId: user?.id ?? null,
  });
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPmThread(teamId);
  }, [teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim() || isSending) return;
    const ok = await sendMessage(draft, teamId);
    if (ok) setDraft('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Message Owner</span>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm text-center px-4">
            No messages yet. Send a message to your owner below.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                  <span className="text-xs text-muted-foreground px-1">{isMe ? 'You' : 'Owner'}</span>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words',
                      isMe
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
          placeholder="Type a message… (⌘↵ to send)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isSending}
          className="min-h-[64px] resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSend} disabled={!draft.trim() || isSending} className="gap-2">
            {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Owner PM List ───────────────────────────────────────────────────────────

function PmListItem({
  pmName,
  lastMessage,
  lastMessageAt,
  unreadCount,
  onClick,
}: {
  pmName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  onClick: () => void;
}) {
  const initials = pmName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
    >
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {initials}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground truncate">{pmName}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(lastMessageAt), { addSuffix: false })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMessage}</p>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center px-1.5 flex-shrink-0">
          {unreadCount}
        </div>
      )}
    </button>
  );
}

// ─── Main FloatingMessageBubble ──────────────────────────────────────────────

export function FloatingMessageBubble() {
  const { user } = useAuth();
  const { isPM, teamId: pmTeamId } = useIsPM();
  const { team } = useTeam();
  const ownerTeamId = team?.id ?? null;

  // For owners: get PM summaries
  const { summaries, totalUnread, markSeen } = useTeamMessages(
    !isPM ? ownerTeamId : null
  );

  // For PMs: unread from localStorage-based simple check (we'll just show 0 for now — can extend later)
  const pmUnread = 0;

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'thread'>('list');
  const [selectedPm, setSelectedPm] = useState<{ id: string; name: string } | null>(null);

  const unreadCount = isPM ? pmUnread : totalUnread;
  const hasUnread = unreadCount > 0;

  // When panel closes, reset view to list
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setView('list');
      setSelectedPm(null);
    }, 200);
  };

  const handleOpenPmThread = (pmId: string, pmName: string) => {
    setSelectedPm({ id: pmId, name: pmName });
    setView('thread');
    markSeen(pmId);
  };

  if (!user) return null;

  // Don't show if owner has no team members and no messages
  if (!isPM && summaries.length === 0 && !ownerTeamId) return null;

  return (
    <>
      {/* Panel */}
      <div
        className={cn(
          'fixed z-[60] transition-all duration-200 origin-bottom-right',
          'bottom-6 right-6',
          'w-80 sm:w-80',
          // On mobile: full width minus padding
          'max-w-[calc(100vw-2rem)]',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
        style={{ height: view === 'thread' ? '480px' : 'auto', maxHeight: '480px' }}
      >
        <div className="bg-popover border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {isPM ? 'Message Owner' : 'Team Messages'}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* PM view: direct thread */}
            {isPM && pmTeamId && (
              <PmThreadView teamId={pmTeamId} />
            )}

            {/* Owner view: list or thread */}
            {!isPM && (
              <>
                {view === 'list' && (
                  <div className="flex flex-col">
                    {summaries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm text-center px-6 gap-2">
                        <MessageCircle className="h-8 w-8 opacity-30" />
                        <p>No messages yet.</p>
                        <p className="text-xs">Team members can message you from their projects.</p>
                      </div>
                    ) : (
                      summaries.map((s) => (
                        <PmListItem
                          key={s.pmId}
                          pmName={s.pmName}
                          lastMessage={s.lastMessage}
                          lastMessageAt={s.lastMessageAt}
                          unreadCount={s.unreadCount}
                          onClick={() => handleOpenPmThread(s.pmId, s.pmName)}
                        />
                      ))
                    )}
                  </div>
                )}

                {view === 'thread' && selectedPm && ownerTeamId && (
                  <MessageThreadPanel
                    pmId={selectedPm.id}
                    pmName={selectedPm.name}
                    teamId={ownerTeamId}
                    onBack={() => setView('list')}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className={cn(
          'fixed bottom-6 right-6 z-[60]',
          'h-14 w-14 rounded-full shadow-lg',
          'bg-primary text-primary-foreground',
          'flex items-center justify-center',
          'transition-all duration-200 hover:scale-110 active:scale-95',
          hasUnread && 'animate-pulse',
          isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
        )}
        aria-label="Team Messages"
      >
        <MessageCircle className="h-6 w-6" />

        {/* Unread badge */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center px-1 animate-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ArrowLeft, Loader2, Send, Users, Headphones } from 'lucide-react';
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
import { SupportChatPanel } from './SupportChatPanel';

// ── PM Thread View ────────────────────────────────────────────────────────────

function PmThreadView({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const { messages, isLoading, isSending, sendMessage, fetchPmThread } =
    useMessageThread({ teamId, pmId: user?.id ?? null });
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
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0 bg-muted/20">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">Message Owner</span>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Direct channel</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading conversation…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No messages yet. Send your first message below.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}
                >
                  <span className="text-[11px] text-muted-foreground px-1">
                    {isMe ? 'You' : 'Owner'}
                  </span>
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
                  <span className="text-[10px] text-muted-foreground/60 px-1">
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
          className="min-h-[56px] resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!draft.trim() || isSending}
            className="gap-1.5"
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

// ── PM List Item ──────────────────────────────────────────────────────────────

interface PmListItemProps {
  pmName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  onClick: () => void;
}

function PmListItem({
  pmName,
  lastMessage,
  lastMessageAt,
  unreadCount,
  onClick,
}: PmListItemProps) {
  const initials = pmName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-150 text-left border-b border-border/40 last:border-0',
        'hover:bg-muted/40 active:bg-muted/60',
        hasUnread && 'bg-primary/[0.03]'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold',
            hasUnread
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary'
          )}
        >
          {initials}
        </div>
        {/* Online pulse (static indicator) */}
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-popover" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'text-sm truncate',
              hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'
            )}
          >
            {pmName}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(lastMessageAt), { addSuffix: false })}
          </span>
        </div>
        <p
          className={cn(
            'text-xs truncate mt-0.5',
            hasUnread ? 'text-foreground/80' : 'text-muted-foreground'
          )}
        >
          {lastMessage}
        </p>
      </div>

      {/* Unread badge */}
      {hasUnread && (
        <div className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5 flex-shrink-0">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
}

// ── Owner Empty State ─────────────────────────────────────────────────────────

function OwnerEmptyState() {
  return (
    <div className="flex flex-col h-full">
      {/* Ghost example items */}
      <div className="px-4 py-2 bg-muted/20 border-b border-border/40">
        <span className="text-[10px] text-muted-foreground italic">
          Invite team members to unlock real-time chat
        </span>
      </div>
      {[
        { initials: 'JR', name: 'Jose Rodriguez', preview: 'Drywall delivery confirmed 👍', time: '2h ago' },
        { initials: 'MK', name: 'Mike Kowalski', preview: 'Permit approved — framing starts Monday', time: 'Yesterday' },
      ].map((item) => (
        <div
          key={item.name}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/40 opacity-40 cursor-default select-none"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
            {item.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="text-[10px] text-muted-foreground">{item.time}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{item.preview}</p>
          </div>
        </div>
      ))}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center py-6">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Users className="h-4.5 w-4.5 text-muted-foreground/50" />
        </div>
        <p className="text-xs text-muted-foreground">
          Real conversations appear here once team members message you.
        </p>
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  unreadCount?: number;
}

function TabButton({ isActive, onClick, icon: Icon, label, unreadCount = 0 }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all duration-150',
        isActive
          ? 'text-primary border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{label}</span>

      {/* Indicator dot for unread */}
      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute top-1.5 right-3 h-2 w-2 rounded-full bg-destructive',
            'ring-2 ring-popover'
          )}
        />
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function FloatingMessageBubble() {
  const { user } = useAuth();
  const { isPM, teamId: pmTeamId } = useIsPM();
  const { team } = useTeam();
  const ownerTeamId = team?.id ?? null;

  const { summaries, totalUnread, markSeen } = useTeamMessages(
    !isPM ? ownerTeamId : null
  );

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'support'>('team');
  const [view, setView] = useState<'list' | 'thread'>('list');
  const [selectedPm, setSelectedPm] = useState<{ id: string; name: string } | null>(null);

  const unreadCount = isPM ? 0 : totalUnread;
  const hasUnread = unreadCount > 0;

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setView('list');
      setSelectedPm(null);
    }, 200);
  };

  const handleTabChange = (tab: 'team' | 'support') => {
    setActiveTab(tab);
    setView('list');
    setSelectedPm(null);
  };

  const handleOpenPmThread = (pmId: string, pmName: string) => {
    setSelectedPm({ id: pmId, name: pmName });
    setView('thread');
    markSeen(pmId);
  };

  if (!user) return null;

  const selectedSummary = selectedPm
    ? summaries.find((s) => s.pmId === selectedPm.id)
    : null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[59]"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed z-[60] bottom-6 right-6 max-w-[calc(100vw-2rem)]',
          'w-[22rem] sm:w-[22rem]',
          'transition-all duration-200 ease-out origin-bottom-right',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        )}
        style={{ height: 560, maxHeight: 560 }}
      >
        <div className="bg-popover border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden h-full">
          {/* ── Panel Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2.5">
              {view === 'thread' && selectedPm ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0 -ml-1"
                    onClick={() => { setView('list'); setSelectedPm(null); }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground leading-tight">
                      {selectedPm.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Project Manager</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="h-3.5 w-3.5 text-primary" />
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-popover" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">Messages</span>
                  {hasUnread && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* ── Tab Bar (only show on list view) ── */}
          {view === 'list' && (
            <div className="flex border-b border-border bg-muted/20 flex-shrink-0">
              <TabButton
                isActive={activeTab === 'team'}
                onClick={() => handleTabChange('team')}
                icon={Users}
                label="Team"
                unreadCount={totalUnread}
              />
              <TabButton
                isActive={activeTab === 'support'}
                onClick={() => handleTabChange('support')}
                icon={Headphones}
                label="Support"
              />
            </div>
          )}

          {/* ── Content ── */}
          <div className="flex-1 overflow-hidden">
            {/* Support tab */}
            {activeTab === 'support' && view === 'list' && <SupportChatPanel />}

            {/* Team tab */}
            {activeTab === 'team' && (
              <>
                {/* PM view: direct thread with owner */}
                {isPM && pmTeamId && view === 'list' && (
                  <PmThreadView teamId={pmTeamId} />
                )}

                {/* Owner view: list of PM conversations */}
                {!isPM && view === 'list' && (
                  <>
                    {summaries.length === 0 ? (
                      <OwnerEmptyState />
                    ) : (
                      <ScrollArea className="h-full">
                        {summaries.map((s) => (
                          <PmListItem
                            key={s.pmId}
                            pmName={s.pmName}
                            lastMessage={s.lastMessage}
                            lastMessageAt={s.lastMessageAt}
                            unreadCount={s.unreadCount}
                            onClick={() => handleOpenPmThread(s.pmId, s.pmName)}
                          />
                        ))}
                      </ScrollArea>
                    )}
                  </>
                )}

                {/* Owner view: individual PM thread */}
                {!isPM && view === 'thread' && selectedPm && ownerTeamId && (
                  <MessageThreadPanel
                    pmId={selectedPm.id}
                    pmName={selectedPm.name}
                    teamId={ownerTeamId}
                    onBack={() => { setView('list'); setSelectedPm(null); }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── FAB Button ── */}
      <button
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className={cn(
          'fixed bottom-6 right-6 z-[60]',
          'h-14 w-14 rounded-full shadow-xl',
          'bg-primary text-primary-foreground',
          'flex items-center justify-center',
          'transition-all duration-200 ease-out',
          'hover:scale-110 hover:shadow-primary/30 hover:shadow-2xl active:scale-95',
          isOpen
            ? 'opacity-0 pointer-events-none scale-75 rotate-90'
            : 'opacity-100 scale-100 rotate-0'
        )}
        aria-label="Team Messages"
      >
        <MessageCircle className="h-6 w-6" />

        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1 ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}

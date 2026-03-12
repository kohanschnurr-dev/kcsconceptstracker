import { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, Bookmark, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SEED_GUIDELINES,
  PHASE_LABELS,
  type ConstructionPhase,
  type GuidelinePage,
} from '@/lib/ruleGroups';

interface OperationCode {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_completed: boolean | null;
}

interface GuidelineSidebarProps {
  /** The current construction phase to filter guidelines */
  phase?: ConstructionPhase;
  /** User-created rules to show alongside seeds */
  rules?: OperationCode[];
  /** Optional class for positioning */
  className?: string;
}

function parseGuideline(rule: OperationCode): { philosophy: string; standard: string } {
  if (!rule.description) return { philosophy: '', standard: '' };
  const phMatch = rule.description.match(/\[Philosophy\]\s*([\s\S]*?)(?:\[Standard\]|$)/i);
  const stMatch = rule.description.match(/\[Standard\]\s*([\s\S]*?)$/i);
  if (phMatch || stMatch) {
    return {
      philosophy: phMatch?.[1]?.trim() || '',
      standard: stMatch?.[1]?.trim() || '',
    };
  }
  return { philosophy: rule.description, standard: '' };
}

export function GuidelineSidebar({ phase, rules = [], className }: GuidelineSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Build filtered guideline list
  const guidelines = useMemo(() => {
    const pages: Array<{
      title: string;
      philosophy: string;
      standard: string;
      phase: string;
    }> = [];

    // Seed guidelines — show all if no phase filter, otherwise filter
    SEED_GUIDELINES.forEach(g => {
      if (!phase || g.phase === phase || g.phase === 'general') {
        pages.push({
          title: g.title,
          philosophy: g.philosophy,
          standard: g.standard,
          phase: PHASE_LABELS[g.phase],
        });
      }
    });

    // User rules
    rules.forEach(rule => {
      const parsed = parseGuideline(rule);
      pages.push({
        title: rule.title,
        philosophy: parsed.philosophy,
        standard: parsed.standard,
        phase: rule.category || 'General',
      });
    });

    return pages;
  }, [phase, rules]);

  if (guidelines.length === 0) return null;

  return (
    <>
      {/* Toggle Button — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          "flex items-center gap-1.5 px-2 py-3",
          "bg-slate-800/90 border border-r-0 border-slate-700/50 rounded-l-lg",
          "text-slate-400 hover:text-white transition-colors",
          "font-jakarta text-[10px] uppercase tracking-wider font-semibold",
          "writing-mode-vertical",
          isOpen && "opacity-0 pointer-events-none",
          className
        )}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <BookOpen className="h-3.5 w-3.5 rotate-90" />
        Codex
      </button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-40 w-[340px]",
          "guideline-sidebar font-jakarta",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-white">Reference Codex</p>
              <p className="text-[10px] text-slate-500">
                {phase ? PHASE_LABELS[phase] : 'All Phases'} · {guidelines.length} guideline{guidelines.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700/50"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Guidelines list */}
        <div className="overflow-y-auto h-[calc(100%-60px)] p-4 space-y-2">
          {guidelines.map((g, i) => (
            <div key={i} className="rounded-lg border border-slate-700/30 bg-slate-800/20 overflow-hidden">
              {/* Collapsed header */}
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-slate-700/20 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{g.title}</p>
                  <p className="text-[10px] text-slate-500">{g.phase}</p>
                </div>
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 text-slate-500 transition-transform",
                  expandedIndex === i && "rotate-90"
                )} />
              </button>

              {/* Expanded content */}
              {expandedIndex === i && (
                <div className="px-3 pb-3 space-y-3 border-t border-slate-700/20 pt-3">
                  {g.philosophy && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1">Philosophy</p>
                      <p className="text-[12px] leading-relaxed text-slate-400">{g.philosophy}</p>
                    </div>
                  )}
                  {g.philosophy && g.standard && (
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
                  )}
                  {g.standard && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-1">Standard</p>
                      <p className="text-[12px] leading-relaxed text-slate-400">{g.standard}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

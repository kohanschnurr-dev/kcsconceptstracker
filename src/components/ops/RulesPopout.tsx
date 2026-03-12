import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus, Trash2, Settings, GripVertical, X, BookOpen,
  ChevronLeft, ChevronRight, FileText, Bookmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  loadRuleGroups, saveRuleGroups, toSnakeCase,
  SEED_GUIDELINES, PHASE_LABELS,
  type RuleGroup, type ConstructionPhase, type GuidelinePage,
} from '@/lib/ruleGroups';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OperationCode {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_completed: boolean | null;
}

interface RulesPopoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: OperationCode[];
  onAddRule?: (rule: { title: string; category: string; description?: string }) => Promise<void>;
  onDeleteRule?: (ruleId: string) => Promise<void>;
  onUpdateRuleCategory?: (ruleId: string, newCategory: string) => Promise<void>;
}

/** Parse rule description into Philosophy / Standard sections */
function parseGuideline(rule: OperationCode): { philosophy: string; standard: string } | null {
  if (!rule.description) return null;
  const phMatch = rule.description.match(/\[Philosophy\]\s*([\s\S]*?)(?:\[Standard\]|$)/i);
  const stMatch = rule.description.match(/\[Standard\]\s*([\s\S]*?)$/i);
  if (phMatch || stMatch) {
    return {
      philosophy: phMatch?.[1]?.trim() || '',
      standard: stMatch?.[1]?.trim() || '',
    };
  }
  // If no sections found, treat entire description as philosophy
  return { philosophy: rule.description, standard: '' };
}

/** Format description with Philosophy/Standard markers for storage */
function formatGuidelineDescription(philosophy: string, standard: string): string {
  const parts: string[] = [];
  if (philosophy.trim()) parts.push(`[Philosophy] ${philosophy.trim()}`);
  if (standard.trim()) parts.push(`[Standard] ${standard.trim()}`);
  return parts.join('\n');
}

function SortableGroupRow({ group, canDelete, onDelete }: { group: RuleGroup; canDelete: boolean; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.key });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/40">
      <button {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-slate-300 touch-none">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm flex-1 text-slate-200">{group.label}</span>
      {canDelete && (
        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400/60 hover:text-red-400 hover:bg-red-500/15" onClick={onDelete}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/** A single "page" in the Codex — the card layout for a guideline */
function GuidelinePageCard({
  title,
  philosophy,
  standard,
  pageNumber,
  totalPages,
  phase,
  onDelete,
}: {
  title: string;
  philosophy: string;
  standard: string;
  pageNumber: number;
  totalPages: number;
  phase?: string;
  onDelete?: () => void;
}) {
  return (
    <div className="codex-page p-6 pl-8 space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">
              Guideline {pageNumber} of {totalPages}
              {phase && ` · ${phase}`}
            </span>
          </div>
          <h3 className="text-base font-bold font-jakarta text-slate-100 leading-tight">
            {title}
          </h3>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Philosophy section */}
      {philosophy && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
            Philosophy
          </p>
          <p className="text-[13px] leading-relaxed text-slate-300">
            {philosophy}
          </p>
        </div>
      )}

      {/* Divider */}
      {philosophy && standard && <div className="codex-divider" />}

      {/* Standard section */}
      {standard && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
            Standard
          </p>
          <p className="text-[13px] leading-relaxed text-slate-300">
            {standard}
          </p>
        </div>
      )}
    </div>
  );
}

export function RulesPopout({ open, onOpenChange, rules, onAddRule, onDeleteRule, onUpdateRuleCategory }: RulesPopoutProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [philosophy, setPhilosophy] = useState('');
  const [standard, setStandard] = useState('');
  const [category, setCategory] = useState('');
  const [phase, setPhase] = useState<ConstructionPhase>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [groups, setGroups] = useState<RuleGroup[]>(loadRuleGroups);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Build the combined "pages" — seed guidelines + user-created rules
  const allPages = useMemo(() => {
    const pages: Array<{
      id: string | null;
      title: string;
      philosophy: string;
      standard: string;
      phase: string;
      isSeed: boolean;
    }> = [];

    // Seed guidelines first
    SEED_GUIDELINES.forEach((g, i) => {
      pages.push({
        id: `seed-${i}`,
        title: g.title,
        philosophy: g.philosophy,
        standard: g.standard,
        phase: PHASE_LABELS[g.phase],
        isSeed: true,
      });
    });

    // User-created rules
    rules.forEach(rule => {
      const parsed = parseGuideline(rule);
      pages.push({
        id: rule.id,
        title: rule.title,
        philosophy: parsed?.philosophy || rule.description || '',
        standard: parsed?.standard || '',
        phase: rule.category ? (groups.find(g => g.key === rule.category)?.label || rule.category) : 'General',
        isSeed: false,
      });
    });

    return pages;
  }, [rules, groups]);

  // Clamp current page
  useEffect(() => {
    if (currentPage >= allPages.length && allPages.length > 0) {
      setCurrentPage(allPages.length - 1);
    }
  }, [allPages.length, currentPage]);

  useEffect(() => {
    if (open) {
      setGroups(loadRuleGroups());
    }
  }, [open]);

  useEffect(() => {
    if (groups.length > 0 && !category) {
      setCategory(groups[0].key);
    }
  }, [groups, category]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleSubmit = async () => {
    if (!title.trim() || !onAddRule) return;
    setIsSubmitting(true);
    try {
      const desc = formatGuidelineDescription(philosophy, standard);
      await onAddRule({ title: title.trim(), category, description: desc || undefined });
      setTitle('');
      setPhilosophy('');
      setStandard('');
      setPhase('general');
      setShowForm(false);
      // Navigate to the last page (the new one)
      setCurrentPage(allPages.length); // Will be clamped on next render
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGroup = () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    const key = toSnakeCase(label);
    if (groups.some(g => g.key === key)) return;
    const updated = [...groups, { key, label }];
    setGroups(updated);
    saveRuleGroups(updated);
    setNewGroupLabel('');
  };

  const handleDeleteGroup = async (groupKey: string) => {
    if (groups.length <= 1) return;
    const fallbackGroup = groups.find(g => g.key !== groupKey)!;
    if (onUpdateRuleCategory) {
      const affectedRules = rules.filter(r => r.category === groupKey);
      for (const rule of affectedRules) {
        await onUpdateRuleCategory(rule.id, fallbackGroup.key);
      }
    }
    const updated = groups.filter(g => g.key !== groupKey);
    setGroups(updated);
    saveRuleGroups(updated);
    if (category === groupKey) setCategory(fallbackGroup.key);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = groups.findIndex(g => g.key === active.id);
    const newIndex = groups.findIndex(g => g.key === over.id);
    const reordered = arrayMove(groups, oldIndex, newIndex);
    setGroups(reordered);
    saveRuleGroups(reordered);
  };

  const handleDeletePage = (pageId: string | null) => {
    if (!pageId || !onDeleteRule) return;
    if (pageId.startsWith('seed-')) return; // Can't delete seed guidelines
    onDeleteRule(pageId);
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const goNext = () => setCurrentPage(p => Math.min(p + 1, allPages.length - 1));
  const goPrev = () => setCurrentPage(p => Math.max(p - 1, 0));

  if (!open) return null;

  const currentPageData = allPages[currentPage];

  return (
    <div
      className="fixed inset-0 z-50 overlay-dashboard flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div className="overlay-dashboard-panel-rounded w-full max-w-xl max-h-[85vh] flex flex-col font-jakarta animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-700/40 to-slate-600/20 border border-slate-600/30">
              <BookOpen className="h-5 w-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Book of Rules</h2>
              <p className="text-xs text-slate-500">
                {allPages.length} guideline{allPages.length !== 1 ? 's' : ''} · Institutional Knowledge
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-lg", manageMode ? "text-white bg-slate-700/60" : "text-slate-400 hover:text-white hover:bg-slate-700/50")}
              onClick={() => setManageMode(!manageMode)}
              title="Manage Groups"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
          {manageMode ? (
            /* ─── Group Management ─── */
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rule Groups</h4>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={groups.map(g => g.key)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {groups.map(group => (
                      <SortableGroupRow
                        key={group.key}
                        group={group}
                        canDelete={groups.length > 1}
                        onDelete={() => handleDeleteGroup(group.key)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="flex gap-2">
                <Input
                  placeholder="New group name"
                  value={newGroupLabel}
                  onChange={e => setNewGroupLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                  className="flex-1 bg-slate-800/80 border-slate-600"
                />
                <Button
                  size="sm"
                  className="bg-slate-600 hover:bg-slate-500 text-white"
                  onClick={handleAddGroup}
                  disabled={!newGroupLabel.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ─── Add Guideline Form ─── */}
              {showForm && (
                <div className="space-y-3 p-4 rounded-xl border border-slate-600/30 bg-slate-800/30">
                  <Input
                    placeholder="Guideline title (e.g., The Permit Clock)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="bg-slate-800/80 border-slate-600 font-jakarta font-semibold"
                  />
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block">Philosophy</label>
                    <Textarea
                      placeholder="Why does this rule exist? What hard lesson was learned?"
                      value={philosophy}
                      onChange={e => setPhilosophy(e.target.value)}
                      className="min-h-[60px] resize-none bg-slate-800/80 border-slate-600 text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block">Standard</label>
                    <Textarea
                      placeholder="What is the enforceable rule? What must happen?"
                      value={standard}
                      onChange={e => setStandard(e.target.value)}
                      className="min-h-[60px] resize-none bg-slate-800/80 border-slate-600 text-[13px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block">Group</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-slate-800/80 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(g => (
                            <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block">Phase</label>
                      <Select value={phase} onValueChange={(v) => setPhase(v as ConstructionPhase)}>
                        <SelectTrigger className="bg-slate-800/80 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PHASE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-jakarta font-semibold"
                      disabled={!title.trim() || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? 'Adding...' : 'Add to Codex'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── Paginated Codex View ─── */}
              {allPages.length > 0 && !showForm ? (
                <div className="space-y-4">
                  {/* Current page */}
                  {currentPageData && (
                    <GuidelinePageCard
                      title={currentPageData.title}
                      philosophy={currentPageData.philosophy}
                      standard={currentPageData.standard}
                      pageNumber={currentPage + 1}
                      totalPages={allPages.length}
                      phase={currentPageData.phase}
                      onDelete={
                        !currentPageData.isSeed && onDeleteRule
                          ? () => handleDeletePage(currentPageData.id)
                          : undefined
                      }
                    />
                  )}

                  {/* Page Navigation */}
                  {allPages.length > 1 && (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white hover:bg-slate-700/50 gap-1"
                        disabled={currentPage === 0}
                        onClick={goPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </Button>

                      {/* Page dots */}
                      <div className="flex items-center gap-1.5">
                        {allPages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              i === currentPage
                                ? "w-6 bg-slate-300"
                                : "w-1.5 bg-slate-600 hover:bg-slate-500"
                            )}
                          />
                        ))}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white hover:bg-slate-700/50 gap-1"
                        disabled={currentPage === allPages.length - 1}
                        onClick={goNext}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Table of Contents — compact page list */}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold mb-2">
                      Table of Contents
                    </p>
                    <div className="space-y-1">
                      {allPages.map((page, i) => (
                        <button
                          key={page.id}
                          onClick={() => setCurrentPage(i)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                            i === currentPage
                              ? "bg-slate-700/40 text-white"
                              : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                          )}
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <span className="text-xs font-medium truncate">{page.title}</span>
                          <span className="text-[10px] text-slate-600 ml-auto shrink-0">{page.phase}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : !showForm && allPages.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-3 rounded-2xl bg-slate-800/50 w-fit mx-auto mb-3">
                    <BookOpen className="h-6 w-6 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm">Your Codex is empty</p>
                  <p className="text-slate-500 text-xs mt-1">Add your first guideline to start building institutional knowledge</p>
                </div>
              )}

              {/* Add New Guideline */}
              {onAddRule && !showForm && (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800/30 font-jakarta"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Guideline
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

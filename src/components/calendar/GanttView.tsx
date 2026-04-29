import { useMemo, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import {
  startOfWeek, addDays, differenceInDays, format, isToday,
} from 'date-fns';
import {
  AlertTriangle, Wrench, Zap, Snowflake, Hammer, Paintbrush, Layers,
  Grid3x3, Square, DoorOpen, PaintBucket, Home, Landmark, TreePine,
  Warehouse, Sparkles, CalendarDays, DollarSign, Package, CheckCircle,
  ClipboardList, FileText, ZoomIn, ChevronDown, Plus, User, ArrowUp, ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { CalendarTask } from '@/pages/Calendar';
import { getCategoryGroup, CATEGORY_GROUPS, getCategoryLabel } from '@/lib/calendarCategories';
import { useGanttPreferences } from '@/hooks/useGanttPreferences';

// ─── pure helpers (outside component for stable references) ───────────────────

function getTaskPos(task: CalendarTask, viewStart: Date, zoom: number) {
  const s = new Date(task.startDate);
  const e = new Date(task.endDate);
  const viewEnd = addDays(viewStart, zoom - 1);
  if (e < viewStart || s > viewEnd) return null;
  const off = Math.max(0, differenceInDays(s, viewStart));
  const dur = differenceInDays(e, s) + 1;
  const adjOff = s < viewStart ? 0 : off;
  const adjDur = Math.min(zoom - adjOff, dur);
  return { leftPct: (adjOff / zoom) * 100, widthPct: (adjDur / zoom) * 100 };
}

const GROUP_BG: Record<string, string> = {
  acquisition_admin: 'bg-blue-500',
  structural_exterior: 'bg-red-500',
  rough_ins: 'bg-orange-500',
  inspections: 'bg-purple-500',
  interior_finishes: 'bg-emerald-500',
  milestones: 'bg-amber-500',
};

const DEP_COLORS: Record<string, string> = {
  FS: '#9ca3af',
  SS: '#34d399',
  FF: '#60a5fa',
  SF: '#fbbf24',
};

const FROZEN_W = 192; // px — w-48
const ROW_H = 36;     // px — uniform row height
const TYPE_HEADER_H = 26; // px — type group header row height

const TYPE_ORDER: string[] = ['fix_flip', 'new_construction', 'rental', 'other'];
const TYPE_LABEL: Record<string, string> = {
  fix_flip: 'Fix & Flip',
  new_construction: 'New Construction',
  rental: 'Rentals',
  other: 'Other',
};

function categoryIcon(cat: string, size = 11, cls = ''): ReactNode {
  const p = { size, className: cls, strokeWidth: 2 };
  switch (cat) {
    case 'plumbing_rough': return <Wrench {...p} />;
    case 'electrical_rough': return <Zap {...p} />;
    case 'hvac_rough': return <Snowflake {...p} />;
    case 'framing': case 'demo': return <Hammer {...p} />;
    case 'painting': case 'exterior_paint': return <Paintbrush {...p} />;
    case 'flooring': return <Layers {...p} />;
    case 'tile': case 'countertops': return <Grid3x3 {...p} />;
    case 'cabinetry': return <Square {...p} />;
    case 'windows': return <DoorOpen {...p} />;
    case 'drywall': return <PaintBucket {...p} />;
    case 'roofing': case 'siding': case 'open_house': return <Home {...p} />;
    case 'foundation_piers': return <Landmark {...p} />;
    case 'grading': return <TreePine {...p} />;
    case 'garage': return <Warehouse {...p} />;
    case 'stage_clean': return <Sparkles {...p} />;
    case 'listing_date': case 'sale_closing': case 'closing': return <CalendarDays {...p} />;
    case 'purchase': case 'refinancing': return <DollarSign {...p} />;
    case 'order': case 'item_arrived': return <Package {...p} />;
    case 'city_rough_in': case 'third_party': case 'foundation_pre_pour': case 'final_green_tag': return <CheckCircle {...p} />;
    case 'permitting': return <ClipboardList {...p} />;
    default: {
      switch (getCategoryGroup(cat)) {
        case 'acquisition_admin': return <FileText {...p} />;
        case 'structural_exterior': return <Home {...p} />;
        case 'rough_ins': return <Wrench {...p} />;
        case 'inspections': return <CheckCircle {...p} />;
        case 'interior_finishes': return <Paintbrush {...p} />;
        case 'milestones': return <CalendarDays {...p} />;
        default: return <FileText {...p} />;
      }
    }
  }
}

// ─── component ────────────────────────────────────────────────────────────────

interface GanttViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
  onTaskMove: (taskId: string, newStart: Date, newEnd: Date) => void;
  onAddEvent?: (projectId: string) => void;
}

export function GanttView({ currentDate, tasks, onTaskClick, onTaskMove, onAddEvent }: GanttViewProps) {
  const [zoomDays, setZoomDays] = useState(14);
  const { collapsedProjects, toggleCollapsed, projectOrder, moveProject } = useGanttPreferences();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const grabOffsetRef = useRef(0);
  const [containerWidth, setContainerWidth] = useState(900);
  const innerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track the rendered width of the inner chart div for SVG arrow coordinates
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pan range: ~6 months back, ~6 months forward (~1 year window)
  const PAN_RANGE_DAYS = 365;
  const PAN_LOOKBACK = 180;
  const viewStart = useMemo(
    () => startOfWeek(addDays(currentDate, -PAN_LOOKBACK)),
    [currentDate],
  );

  // Day-cell width derived from the zoom preset
  const COL_W = zoomDays <= 7 ? 110 : zoomDays <= 14 ? 76 : 52;
  // Inner chart width spans the full pan range; native horizontal scrollbar pans
  const timelineWidth = COL_W * PAN_RANGE_DAYS;
  const CHART_MIN = FROZEN_W + timelineWidth;

  const days = useMemo(
    () => Array.from({ length: PAN_RANGE_DAYS }, (_, i) => addDays(viewStart, i)),
    [viewStart],
  );
  const todayIdx = days.findIndex(isToday);

  // Auto-center scroll on today (mount + when zoom or currentDate changes)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || todayIdx < 0) return;
    const todayLeft = FROZEN_W + todayIdx * COL_W;
    // Place today ~30% from the left edge of the visible viewport
    el.scrollLeft = Math.max(0, todayLeft - el.clientWidth * 0.3);
  }, [todayIdx, COL_W]);


  const groupedTasks = useMemo(() => {
    const g: Record<string, CalendarTask[]> = {};
    tasks.forEach(t => { (g[t.projectName] ??= []).push(t); });
    return g;
  }, [tasks]);

  /**
   * Per project, merge tasks that share the same title (case-insensitive, trimmed)
   * into a single row containing multiple instances. Repeating tasks like
   * "Collect Rent" become one row with multiple bars on the same line.
   */
  type MergedRow = { key: string; representative: CalendarTask; instances: CalendarTask[] };
  const mergedTasksByProject = useMemo(() => {
    const out: Record<string, MergedRow[]> = {};
    Object.entries(groupedTasks).forEach(([projectName, ptasks]) => {
      const buckets = new Map<string, MergedRow>();
      ptasks.forEach(t => {
        const k = (t.title || '').trim().toLowerCase() || `__id_${t.id}`;
        const existing = buckets.get(k);
        if (existing) existing.instances.push(t);
        else buckets.set(k, { key: k, representative: t, instances: [t] });
      });
      out[projectName] = Array.from(buckets.values())
        .map(r => ({
          ...r,
          instances: [...r.instances].sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate)),
        }))
        // Newest tasks at the top, oldest at the bottom (by earliest instance start date)
        .sort((a, b) => +new Date(b.instances[0].startDate) - +new Date(a.instances[0].startDate));
    });
    return out;
  }, [groupedTasks]);

  // Map: project name -> projectType (from first task encountered)
  const projectTypeMap = useMemo(() => {
    const m: Record<string, string> = {};
    tasks.forEach(t => {
      if (!m[t.projectName]) m[t.projectName] = (t.projectType as string) || 'other';
    });
    return m;
  }, [tasks]);

  /**
   * Effective project order: group by project type (canonical order), then within
   * each group respect user-saved order, then alphabetical for unsaved.
   */
  const orderedProjectNames = useMemo(() => {
    const names = Object.keys(mergedTasksByProject);
    const inSaved = projectOrder.filter(n => names.includes(n));
    const remaining = names.filter(n => !inSaved.includes(n)).sort((a, b) => a.localeCompare(b));
    const combined = [...inSaved, ...remaining];
    return combined
      .map((name, idx) => ({ name, idx, t: projectTypeMap[name] || 'other' }))
      .sort((a, b) => {
        const ai = TYPE_ORDER.indexOf(a.t);
        const bi = TYPE_ORDER.indexOf(b.t);
        const an = ai === -1 ? TYPE_ORDER.length : ai;
        const bn = bi === -1 ? TYPE_ORDER.length : bi;
        if (an !== bn) return an - bn;
        return a.idx - b.idx;
      })
      .map(x => x.name);
  }, [mergedTasksByProject, projectOrder, projectTypeMap]);

  const orderedProjectEntries = useMemo(
    () => orderedProjectNames.map(name => [name, mergedTasksByProject[name]] as const),
    [orderedProjectNames, mergedTasksByProject],
  );

  // Distinct project types present (in canonical order) — used for header row count
  const distinctTypeCount = useMemo(() => {
    const seen = new Set<string>();
    orderedProjectNames.forEach(n => seen.add(projectTypeMap[n] || 'other'));
    return seen.size;
  }, [orderedProjectNames, projectTypeMap]);


  // Memoised position resolver keyed to current view (% of full pan range)
  const getPos = useCallback(
    (task: CalendarTask) => getTaskPos(task, viewStart, PAN_RANGE_DAYS),
    [viewStart],
  );

  // Y-centre of each task row (for SVG dep arrows). All instances within a merged
  // row share the same Y, since they render on the same line.
  const rowYMap = useMemo(() => {
    const m: Record<string, number> = {};
    let y = 0;
    orderedProjectEntries.forEach(([name, rows]) => {
      y += ROW_H;
      if (!collapsedProjects.has(name)) {
        rows.forEach(row => {
          const center = y + ROW_H / 2;
          row.instances.forEach(t => { m[t.id] = center; });
          y += ROW_H;
        });
      }
    });
    return m;
  }, [orderedProjectEntries, collapsedProjects]);

  const totalBodyH = useMemo(() =>
    orderedProjectEntries.reduce(
      (h, [name, rows]) => h + ROW_H + (collapsedProjects.has(name) ? 0 : rows.length * ROW_H),
      0,
    ) + distinctTypeCount * TYPE_HEADER_H,
  [orderedProjectEntries, collapsedProjects, distinctTypeCount]);

  // Pre-compute dependency arrow segments
  const depArrows = useMemo(() => {
    const out: { key: string; x1: number; y1: number; x2: number; y2: number; type: string }[] = [];
    tasks.forEach(task => {
      (task.dependencies || []).forEach(dep => {
        const from = tasks.find(t => t.id === dep.taskId);
        if (!from) return;
        const fp = getPos(from);
        const tp = getPos(task);
        const fy = rowYMap[dep.taskId];
        const ty = rowYMap[task.id];
        if (!fp || !tp || fy == null || ty == null) return;
        const tw = timelineWidth;
        let x1: number, x2: number;
        switch (dep.type) {
          case 'SS': x1 = fp.leftPct / 100 * tw;                     x2 = tp.leftPct / 100 * tw; break;
          case 'FF': x1 = (fp.leftPct + fp.widthPct) / 100 * tw;     x2 = (tp.leftPct + tp.widthPct) / 100 * tw; break;
          case 'SF': x1 = fp.leftPct / 100 * tw;                     x2 = (tp.leftPct + tp.widthPct) / 100 * tw; break;
          default:   x1 = (fp.leftPct + fp.widthPct) / 100 * tw;     x2 = tp.leftPct / 100 * tw; // FS
        }
        out.push({ key: `${task.id}-${dep.taskId}`, x1, y1: fy, x2, y2: ty, type: dep.type || 'FS' });
      });
    });
    return out;
  }, [tasks, getPos, rowYMap, timelineWidth]);

  // ─── helpers ──────────────────────────────────────────────────────────────

  const isMilestone = (t: CalendarTask) =>
    differenceInDays(new Date(t.endDate), new Date(t.startDate)) === 0 ||
    getCategoryGroup(t.eventCategory || '') === 'milestones';

  const barBg = (t: CalendarTask) =>
    GROUP_BG[getCategoryGroup(t.eventCategory || 'due_diligence')] ?? 'bg-slate-500';

  const hasDependencyWarning = (t: CalendarTask) =>
    (t.dependencies || []).some(dep => {
      const d = tasks.find(x => x.id === dep.taskId);
      return d && d.status !== 'complete' && new Date(t.startDate) <= new Date(d.endDate);
    });

  const toggleProject = (name: string) => toggleCollapsed(name);

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTask) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const rawDayIdx = Math.floor(((e.clientX - rect.left) / rect.width) * PAN_RANGE_DAYS);
    const dayIdx = rawDayIdx - grabOffsetRef.current;
    const task = tasks.find(t => t.id === draggedTask);
    if (!task) return;
    const dur = differenceInDays(new Date(task.endDate), new Date(task.startDate));
    const ns = addDays(viewStart, Math.max(0, Math.min(PAN_RANGE_DAYS - 1 - dur, dayIdx)));
    onTaskMove(draggedTask, ns, addDays(ns, dur));
    setDraggedTask(null);
    grabOffsetRef.current = 0;
  };

  const startBarDrag = (e: React.DragEvent, task: CalendarTask, isMs: boolean) => {
    if (isMs) {
      grabOffsetRef.current = 0;
    } else {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const dur = differenceInDays(new Date(task.endDate), new Date(task.startDate)) + 1;
      const cursorPct = (e.clientX - rect.left) / Math.max(rect.width, 1);
      grabOffsetRef.current = Math.max(0, Math.min(dur - 1, Math.floor(cursorPct * dur)));
    }
    setDraggedTask(task.id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', task.id); } catch { /* noop */ }
  };

  const summaryPos = (ptasks: CalendarTask[]) => {
    const vis = ptasks.filter(t => getPos(t));
    if (!vis.length) return null;
    const syn = { ...vis[0], startDate: new Date(Math.min(...vis.map(t => +new Date(t.startDate)))), endDate: new Date(Math.max(...vis.map(t => +new Date(t.endDate)))) };
    return getPos(syn);
  };

  const colStyle: React.CSSProperties = { width: COL_W, flex: '0 0 auto' };

  const scrollToToday = () => {
    const el = scrollRef.current;
    if (!el || todayIdx < 0) return;
    const todayLeft = FROZEN_W + todayIdx * COL_W;
    el.scrollTo({ left: Math.max(0, todayLeft - el.clientWidth * 0.3), behavior: 'smooth' });
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-3">
      {/* Zoom toolbar */}
      <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-2">
        <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 shrink-0">
          {[7, 14, 21].map(d => (
            <Button
              key={d}
              variant="outline"
              size="sm"
              className={cn('h-7 px-3 text-xs rounded-full transition-colors', zoomDays === d && 'bg-primary text-primary-foreground border-primary')}
              onClick={() => setZoomDays(d)}
            >{d}d</Button>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs rounded-full shrink-0"
          onClick={scrollToToday}
        >Today</Button>
      </div>

      {/* Chart container — horizontal scroll on overflow, frozen left col */}
      <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-border">
        <div ref={innerRef} style={{ minWidth: CHART_MIN }}>

          {/* ── Day header ── */}
          <div className="flex border-b-2 border-border sticky top-0 z-30 bg-background">
            <div
              className="shrink-0 sticky left-0 z-30 bg-background border-r border-border px-3 flex items-end pb-2"
              style={{ width: FROZEN_W }}
            >
              <span className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">Project / Task</span>
            </div>
            <div className="flex flex-1">
              {days.map((day, i) => (
                <div
                  key={i}
                  style={colStyle}
                  className={cn('text-center border-r border-border/40 py-1', isToday(day) && 'bg-primary/5')}
                >
                  <div className="text-[10px] text-muted-foreground/60">{format(day, 'EEE')}</div>
                  <div className={cn('text-[12px] font-semibold', isToday(day) ? 'text-primary' : 'text-foreground/80')}>
                    {format(day, 'd')}
                  </div>
                  <div className="text-[9px] text-muted-foreground/40">{format(day, 'MMM')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="relative" style={{ minHeight: Math.max(totalBodyH, 80) }}>

            {/* Vertical gridlines (behind bars) */}
            <div className="absolute inset-0 pointer-events-none" style={{ left: FROZEN_W }}>
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn('absolute inset-y-0 border-r', isToday(day) ? 'border-primary/25' : 'border-border/20')}
                  style={{ left: `${(i / PAN_RANGE_DAYS) * 100}%`, width: 0 }}
                />
              ))}
            </div>

            {/* Today red vertical line */}
            {todayIdx !== -1 && (
              <div
                className="absolute inset-y-0 z-20 pointer-events-none"
                style={{
                  left: FROZEN_W + ((todayIdx + 0.5) / PAN_RANGE_DAYS) * timelineWidth,
                  width: 2,
                  background: 'hsl(0 84% 60% / 0.80)',
                }}
              >
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-red-500 text-white rounded px-1.5 py-0.5 whitespace-nowrap shadow-sm font-medium"
                  style={{ fontSize: 9, top: 0 }}
                >
                  {format(new Date(), 'MMM d')}
                </div>
              </div>
            )}

            {/* Dependency arrows SVG overlay */}
            {depArrows.length > 0 && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: FROZEN_W,
                  width: timelineWidth,
                  height: totalBodyH,
                  pointerEvents: 'none',
                  overflow: 'visible',
                  zIndex: 5,
                }}
              >
                <defs>
                  {Object.entries(DEP_COLORS).map(([type, color]) => (
                    <marker
                      key={type}
                      id={`gm-${type}`}
                      viewBox="0 0 8 8"
                      refX="7"
                      refY="4"
                      markerWidth="5"
                      markerHeight="5"
                      orient="auto"
                    >
                      <path d="M0,0 L8,4 L0,8 Z" fill={color} />
                    </marker>
                  ))}
                </defs>
                {depArrows.map(({ key, x1, y1, x2, y2, type }) => {
                  const color = DEP_COLORS[type] ?? DEP_COLORS.FS;
                  const mx = (x1 + x2) / 2;
                  return (
                    <path
                      key={key}
                      d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                      stroke={color}
                      strokeWidth="1.5"
                      fill="none"
                      strokeDasharray={type === 'FS' ? undefined : '4 3'}
                      markerEnd={`url(#gm-${type})`}
                      opacity={0.75}
                    />
                  );
                })}
              </svg>
            )}

            {/* ── Project groups ── */}
            {(() => {
              let prevType: string | null = null;
              return orderedProjectEntries.map(([projectName, rows], projectIdx) => {
              const collapsed = collapsedProjects.has(projectName);
              const projectTasks = groupedTasks[projectName] ?? [];
              const sp = summaryPos(projectTasks);
              const projectId = projectTasks[0]?.projectId;
              const isFirst = projectIdx === 0;
              const isLast = projectIdx === orderedProjectEntries.length - 1;
              const currType = projectTypeMap[projectName] || 'other';
              const showHeader = currType !== prevType;
              prevType = currType;

              return (
                <div key={projectName} className="group/project">
                  {showHeader && (
                    <div
                      className="flex items-center bg-secondary border-y border-border"
                      style={{ height: TYPE_HEADER_H }}
                    >
                      <div
                        className="sticky left-0 z-[15] px-3 bg-secondary text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80 flex items-center"
                        style={{ minWidth: FROZEN_W, height: TYPE_HEADER_H }}
                      >
                        {TYPE_LABEL[currType] ?? 'Other'}
                      </div>
                    </div>
                  )}
                  {/* Project summary row */}
                  <div className="flex items-center border-b border-border bg-secondary/25" style={{ height: ROW_H }}>
                    {/* Frozen: name + collapse + reorder + add button */}
                    <div
                      className="shrink-0 sticky left-0 z-10 bg-secondary border-r border-border flex items-center gap-1 px-2"
                      style={{ width: FROZEN_W, height: ROW_H }}
                    >
                      <button
                        onClick={() => toggleProject(projectName)}
                        className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors min-w-0 flex-1"
                      >
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', collapsed && '-rotate-90')}
                        />
                        <span className="truncate">{projectName}</span>
                      </button>
                      <div className="flex items-center opacity-0 group-hover/project:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveProject(projectName, 'up', orderedProjectNames); }}
                          disabled={isFirst}
                          title="Move up"
                          className="shrink-0 text-muted-foreground hover:text-primary rounded transition-colors p-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveProject(projectName, 'down', orderedProjectNames); }}
                          disabled={isLast}
                          title="Move down"
                          className="shrink-0 text-muted-foreground hover:text-primary rounded transition-colors p-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      {onAddEvent && projectId && (
                        <button
                          onClick={() => onAddEvent(projectId)}
                          title={`Add event to ${projectName}`}
                          className="shrink-0 text-muted-foreground hover:text-primary rounded transition-colors p-0.5 ml-1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {/* Timeline: summary chevron bar */}
                    <div className="flex-1 relative" style={{ height: ROW_H }}>
                      {sp && (
                        <div
                          className="absolute"
                          style={{
                            left: `${sp.leftPct}%`,
                            width: `max(${sp.widthPct}%, 6px)`,
                            top: '50%',
                            height: 8,
                            transform: 'translateY(-50%)',
                            background: 'hsl(var(--foreground) / 0.20)',
                            clipPath: 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)',
                            borderRadius: '2px 0 0 2px',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Task rows — instantly hidden when collapsed (no animation on mount) */}
                  {!collapsed && (
                  <div>

                    {rows.map(row => {
                      const rep = row.representative;
                      const rowDepWarn = row.instances.some(t => hasDependencyWarning(t));

                      return (
                        <div
                          key={row.key}
                          className="flex items-center border-b border-border/30 group"
                          style={{ height: ROW_H }}
                        >
                          {/* Frozen: icon + title (one entry per merged row) */}
                          <div
                            className="shrink-0 sticky left-0 z-10 bg-background border-r border-border/40 flex items-center gap-1.5 px-3"
                            style={{ width: FROZEN_W, height: ROW_H }}
                          >
                            <span className="shrink-0 text-muted-foreground/50">
                              {categoryIcon(rep.eventCategory || 'due_diligence', 11)}
                            </span>
                            <button
                              onClick={() => onTaskClick(rep)}
                              className="flex-1 min-w-0 text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
                            >
                              {rep.title}
                            </button>
                            {rowDepWarn && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-amber-950 border-amber-800 text-amber-200 text-xs">
                                  Predecessor incomplete
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>

                          {/* Timeline: one bar/diamond per instance, all on the same line */}
                          <div
                            className="flex-1 relative"
                            style={{ height: ROW_H }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleTimelineDrop}
                          >
                            {row.instances.map(task => {
                              const pos = getPos(task);
                              if (!pos) return null;
                              const ms = isMilestone(task);
                              const barPx = (pos.widthPct / 100) * timelineWidth;
                              const showLabel = !ms && barPx > 52 && row.instances.length === 1;
                              const done = task.isCompleted || task.status === 'complete';
                              const durDays = differenceInDays(new Date(task.endDate), new Date(task.startDate));

                              return (
                                <Tooltip key={task.id}>
                                  <TooltipTrigger asChild>
                                    {ms ? (
                                      <div
                                        onClick={() => onTaskClick(task)}
                                        className={cn(
                                          'absolute cursor-pointer hover:scale-125 transition-transform shadow-sm z-10',
                                          barBg(task),
                                          task.isCriticalPath && 'ring-1 ring-rose-400',
                                          done && 'opacity-50',
                                        )}
                                        style={{
                                          width: 14,
                                          height: 14,
                                          left: `calc(${pos.leftPct + pos.widthPct / 2}% - 7px)`,
                                          top: 'calc(50% - 7px)',
                                          transform: 'rotate(45deg)',
                                        }}
                                      />
                                    ) : (
                                      <div
                                        draggable
                                        onDragStart={e => { setDraggedTask(task.id); e.dataTransfer.effectAllowed = 'move'; }}
                                        onDragEnd={() => setDraggedTask(null)}
                                        onClick={() => onTaskClick(task)}
                                        className={cn(
                                          'absolute rounded shadow-sm cursor-grab active:cursor-grabbing z-10',
                                          'hover:brightness-110 hover:ring-2 hover:ring-white/25 transition-all',
                                          barBg(task),
                                          task.isCriticalPath && 'ring-1 ring-rose-400 ring-inset',
                                          done && 'opacity-55',
                                          draggedTask === task.id && 'opacity-40 cursor-grabbing',
                                        )}
                                        style={{
                                          left: `${pos.leftPct}%`,
                                          width: `max(${pos.widthPct}%, 4px)`,
                                          top: '50%',
                                          height: 22,
                                          transform: 'translateY(-50%)',
                                        }}
                                      >
                                        <div className="flex items-center h-full gap-1 px-1.5 overflow-hidden">
                                          <span className="shrink-0">
                                            {categoryIcon(task.eventCategory || 'due_diligence', 10, 'text-white')}
                                          </span>
                                          {showLabel && (
                                            <span className="text-[10px] text-white font-medium truncate leading-none">
                                              {task.title}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-card border-border max-w-[220px]">
                                    <div className="text-xs space-y-1 py-0.5">
                                      <p className="font-semibold text-foreground leading-tight">{task.title}</p>
                                      <p className="text-muted-foreground">
                                        {format(new Date(task.startDate), 'MMM d')} → {format(new Date(task.endDate), 'MMM d, yyyy')}
                                      </p>
                                      <p className="text-muted-foreground">{durDays + 1} {durDays === 0 ? 'day' : 'days'}</p>
                                      <p className="text-muted-foreground">{getCategoryLabel(task.eventCategory || 'due_diligence')}</p>
                                      {task.owner && (
                                        <p className="flex items-center gap-1 text-muted-foreground">
                                          <User className="h-3 w-3 shrink-0" />
                                          {task.owner}
                                        </p>
                                      )}
                                      {(task.dependencies?.length ?? 0) > 0 && (
                                        <p className="text-muted-foreground">
                                          {task.dependencies!.length} dep{task.dependencies!.length > 1 ? 's' : ''}:{' '}
                                          {task.dependencies!.map(d => d.type).join(', ')}
                                        </p>
                                      )}
                                      {task.isCriticalPath && (
                                        <p className="text-rose-400 font-medium">Critical Path</p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
              );
              });
            })()}

            {tasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                No events in this date range
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend rendered once at the page level via <CalendarLegend /> in Calendar.tsx */}
    </div>
  );
}

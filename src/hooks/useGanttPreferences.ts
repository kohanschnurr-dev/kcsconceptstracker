import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GanttPrefsState {
  projectOrder: string[];
  collapsedProjects: string[];
}

const EMPTY: GanttPrefsState = { projectOrder: [], collapsedProjects: [] };

/**
 * Per-account preferences for the Gantt view: project order + which projects
 * are collapsed. Optimistic updates locally, debounced upsert to Supabase.
 */
export function useGanttPreferences() {
  const [state, setState] = useState<GanttPrefsState>(EMPTY);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<GanttPrefsState>(EMPTY);

  // Load on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      if (!uid) { setIsReady(true); return; }

      const { data } = await supabase
        .from('gantt_preferences')
        .select('project_order, collapsed_projects')
        .eq('user_id', uid)
        .maybeSingle();

      if (cancelled) return;
      const next: GanttPrefsState = {
        projectOrder: Array.isArray(data?.project_order) ? (data!.project_order as string[]) : [],
        collapsedProjects: Array.isArray(data?.collapsed_projects) ? (data!.collapsed_projects as string[]) : [],
      };
      latestRef.current = next;
      setState(next);
      setIsReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((next: GanttPrefsState) => {
    latestRef.current = next;
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from('gantt_preferences').upsert({
        user_id: userId,
        project_order: latestRef.current.projectOrder,
        collapsed_projects: latestRef.current.collapsedProjects,
      }, { onConflict: 'user_id' });
    }, 400);
  }, [userId]);

  const toggleCollapsed = useCallback((name: string) => {
    setState(prev => {
      const has = prev.collapsedProjects.includes(name);
      const next: GanttPrefsState = {
        ...prev,
        collapsedProjects: has
          ? prev.collapsedProjects.filter(n => n !== name)
          : [...prev.collapsedProjects, name],
      };
      persist(next);
      return next;
    });
  }, [persist]);

  /**
   * Move project up/down. `currentOrder` is the effective order currently
   * shown (saved order + any unsaved trailing projects in alpha order).
   */
  const moveProject = useCallback((name: string, dir: 'up' | 'down', currentOrder: string[]) => {
    const idx = currentOrder.indexOf(name);
    if (idx < 0) return;
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= currentOrder.length) return;
    const arr = [...currentOrder];
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setState(prev => {
      const next = { ...prev, projectOrder: arr };
      persist(next);
      return next;
    });
  }, [persist]);

  const collapsedSet = useMemo(() => new Set(state.collapsedProjects), [state.collapsedProjects]);

  return {
    projectOrder: state.projectOrder,
    collapsedProjects: collapsedSet,
    toggleCollapsed,
    moveProject,
    isReady,
  };
}

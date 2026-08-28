import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CostHistoryProject {
  id: string;
  name: string;
  status: string;
  projectType?: string;
  address?: string;
}

export interface CategoryProjectStat {
  projectId: string;
  projectName: string;
  status: string;
  budgeted: number;
  actual: number;
}

export interface CategoryStat {
  category: string;
  budgeted: number;
  actual: number;
  projects: CategoryProjectStat[];
}

interface RawCategory {
  id: string;
  project_id: string;
  category: string;
  estimated_budget: number | null;
}

interface RawExpense {
  project_id: string | null;
  category_id: string | null;
  amount: number | null;
}

const sel = (s: string): string => s;

export function useCostHistory(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<CostHistoryProject[]>([]);
  const [categories, setCategories] = useState<RawCategory[]>([]);
  const [expenses, setExpenses] = useState<RawExpense[]>([]);
  const [qbExpenses, setQbExpenses] = useState<RawExpense[]>([]);

  useEffect(() => {
    if (!enabled || loaded || loading) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [projRes, catRes, expRes, qbRes] = await Promise.all([
        supabase
          .from('projects')
          .select(sel('id, name, status, project_type, address'))
          .is('deleted_at', null)
          .returns<
            { id: string; name: string; status: string; project_type: string; address: string }[]
          >(),
        supabase
          .from('project_categories')
          .select(sel('id, project_id, category, estimated_budget'))
          .returns<RawCategory[]>(),
        supabase
          .from('expenses')
          .select(sel('project_id, category_id, amount'))
          .eq('status', 'actual')
          .eq('is_hidden', false)
          .returns<RawExpense[]>(),
        supabase
          .from('quickbooks_expenses')
          .select(sel('project_id, category_id, amount'))
          .eq('is_imported', true)
          .eq('is_hidden', false)
          .returns<RawExpense[]>(),
      ]);

      if (cancelled) return;
      setProjects(
        (projRes.data || []).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          projectType: p.project_type,
          address: p.address,
        })),
      );
      setCategories(catRes.data || []);
      setExpenses(expRes.data || []);
      setQbExpenses(qbRes.data || []);
      setLoading(false);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, loaded, loading]);

  const stats = useMemo(() => {
    const projectById = new Map(projects.map((p) => [p.id, p]));
    const catById = new Map(categories.map((c) => [c.id, c]));

    // key: `${category}|${projectId}`
    const cell = new Map<string, CategoryProjectStat>();

    const ensure = (category: string, projectId: string): CategoryProjectStat | null => {
      const proj = projectById.get(projectId);
      if (!proj) return null;
      const key = `${category}|${projectId}`;
      let entry = cell.get(key);
      if (!entry) {
        entry = {
          projectId,
          projectName: proj.name,
          status: proj.status,
          budgeted: 0,
          actual: 0,
        };
        cell.set(key, entry);
      }
      return entry;
    };

    categories.forEach((c) => {
      const e = ensure(c.category, c.project_id);
      if (e) e.budgeted += Number(c.estimated_budget) || 0;
    });

    const applyActual = (rows: RawExpense[]) => {
      rows.forEach((r) => {
        if (!r.category_id) return;
        const cat = catById.get(r.category_id);
        if (!cat) return;
        const projectId = r.project_id || cat.project_id;
        const e = ensure(cat.category, projectId);
        if (e) e.actual += Number(r.amount) || 0;
      });
    };
    applyActual(expenses);
    applyActual(qbExpenses);

    const byCategory = new Map<string, CategoryStat>();
    cell.forEach((entry, key) => {
      const category = key.split('|')[0];
      let stat = byCategory.get(category);
      if (!stat) {
        stat = { category, budgeted: 0, actual: 0, projects: [] };
        byCategory.set(category, stat);
      }
      stat.budgeted += entry.budgeted;
      stat.actual += entry.actual;
      stat.projects.push(entry);
    });

    return Array.from(byCategory.values()).map((s) => ({
      ...s,
      projects: s.projects.sort((a, b) => b.actual - a.actual),
    }));
  }, [projects, categories, expenses, qbExpenses]);

  return { loading, projects, stats };
}

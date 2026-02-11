import { supabase } from '@/integrations/supabase/client';

/**
 * Core reassign logic: moves all expenses and budgets from oldValue to newValue
 * across all projects. Used by both the ReassignCategoryDialog and inline rename.
 */
export async function reassignBudgetCategory(
  oldValue: string,
  newValue: string
): Promise<{ expensesMoved: number }> {
  // Find all project_categories rows with the old category
  const { data: pcRows } = await supabase
    .from('project_categories')
    .select('id, project_id, estimated_budget')
    .eq('category', oldValue as any);

  const rows = pcRows ?? [];
  if (rows.length === 0) return { expensesMoved: 0 };

  let totalExpensesMoved = 0;
  const projectIds = [...new Set(rows.map(r => r.project_id))];

  for (const projectId of projectIds) {
    const oldRow = rows.find(r => r.project_id === projectId);
    if (!oldRow) continue;

    // Check if new category already exists for this project
    const { data: existing } = await supabase
      .from('project_categories')
      .select('id, estimated_budget')
      .eq('project_id', projectId)
      .eq('category', newValue as any)
      .maybeSingle();

    let newCategoryId: string;

    if (existing) {
      newCategoryId = existing.id;
      const oldBudget = oldRow.estimated_budget ?? 0;
      if (oldBudget > 0) {
        await supabase
          .from('project_categories')
          .update({ estimated_budget: (existing.estimated_budget ?? 0) + oldBudget })
          .eq('id', existing.id);
      }
    } else {
      const { data: inserted, error } = await supabase
        .from('project_categories')
        .insert({ project_id: projectId, category: newValue as any, estimated_budget: oldRow.estimated_budget ?? 0 })
        .select('id')
        .single();
      if (error) throw error;
      newCategoryId = inserted.id;
    }

    // Move expenses
    await supabase
      .from('expenses')
      .update({ category_id: newCategoryId })
      .eq('category_id', oldRow.id);

    await supabase
      .from('quickbooks_expenses')
      .update({ category_id: newCategoryId })
      .eq('category_id', oldRow.id);
  }

  // Delete old project_categories rows
  const oldIds = rows.map(r => r.id);
  await supabase.from('project_categories').delete().in('id', oldIds);

  return { expensesMoved: totalExpensesMoved };
}

/**
 * Reassign a generic DB column value (business_expenses.category, calendar_events.event_category, etc.)
 */
export async function reassignGenericColumn(
  tableName: 'business_expenses' | 'calendar_events' | 'procurement_items',
  columnName: string,
  oldValue: string,
  newValue: string
): Promise<void> {
  const updateObj: Record<string, string> = { [columnName]: newValue };
  const { error } = await (supabase.from(tableName) as any)
    .update(updateObj)
    .eq(columnName, oldValue);
  if (error) throw error;
}

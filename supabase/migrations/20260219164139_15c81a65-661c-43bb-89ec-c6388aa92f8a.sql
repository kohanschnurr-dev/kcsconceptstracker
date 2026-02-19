
-- ============================================================
-- TEAM MEMBER DATA ACCESS: Multi-Tenancy RLS Policies
-- ============================================================
-- Pattern: get_team_owner_id(auth.uid()) returns the owner's
-- user_id for a given PM. If the caller is not a PM, the
-- function returns NULL, so the USING clause evaluates to
-- FALSE and no rows are returned — safe by default.
-- Existing owner policies are NOT touched.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROJECTS
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner projects"
ON public.projects FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

-- ------------------------------------------------------------
-- 2. EXPENSES (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project expenses"
ON public.expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = expenses.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert expenses for owner projects"
ON public.expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = expenses.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can update expenses for owner projects"
ON public.expenses FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = expenses.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 3. TASKS
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner tasks"
ON public.tasks FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

-- PMs insert tasks as themselves (user_id = their own uid)
CREATE POLICY "Team members can insert their own tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.user_id = public.get_team_owner_id(auth.uid())
    )
  )
);

CREATE POLICY "Team members can update their own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. VENDORS
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner vendors"
ON public.vendors FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

-- ------------------------------------------------------------
-- 5. CALENDAR EVENTS
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner calendar events"
ON public.calendar_events FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

CREATE POLICY "Team members can insert calendar events for owner"
ON public.calendar_events FOR INSERT
WITH CHECK (
  user_id = public.get_team_owner_id(auth.uid())
);

CREATE POLICY "Team members can update owner calendar events"
ON public.calendar_events FOR UPDATE
USING (user_id = public.get_team_owner_id(auth.uid()));

-- ------------------------------------------------------------
-- 6. DAILY LOGS (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project daily logs"
ON public.daily_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = daily_logs.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert daily logs for owner projects"
ON public.daily_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = daily_logs.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can update daily logs for owner projects"
ON public.daily_logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = daily_logs.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 7. DAILY LOG TASKS (via daily_logs → projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner daily log tasks"
ON public.daily_log_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_logs dl
    JOIN public.projects p ON p.id = dl.project_id
    WHERE dl.id = daily_log_tasks.daily_log_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert daily log tasks for owner"
ON public.daily_log_tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.daily_logs dl
    JOIN public.projects p ON p.id = dl.project_id
    WHERE dl.id = daily_log_tasks.daily_log_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can update daily log tasks for owner"
ON public.daily_log_tasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_logs dl
    JOIN public.projects p ON p.id = dl.project_id
    WHERE dl.id = daily_log_tasks.daily_log_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 8. PROJECT NOTES (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project notes"
ON public.project_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_notes.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert notes for owner projects"
ON public.project_notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_notes.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can update notes for owner projects"
ON public.project_notes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_notes.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 9. PROJECT PHOTOS (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project photos"
ON public.project_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_photos.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert photos for owner projects"
ON public.project_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_photos.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 10. PROJECT DOCUMENTS (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project documents"
ON public.project_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_documents.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert documents for owner projects"
ON public.project_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_documents.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 11. DOCUMENT FOLDERS (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner document folders"
ON public.document_folders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = document_folders.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert document folders for owner projects"
ON public.document_folders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = document_folders.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 12. PROJECT MILESTONES (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project milestones"
ON public.project_milestones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_milestones.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert milestones for owner projects"
ON public.project_milestones FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_milestones.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can update milestones for owner projects"
ON public.project_milestones FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_milestones.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 13. PROJECT VENDORS (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project vendors"
ON public.project_vendors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_vendors.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 14. PROJECT CATEGORIES (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project categories"
ON public.project_categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_categories.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 15. PROJECT INFO (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project info"
ON public.project_info FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_info.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can insert project info for owner projects"
ON public.project_info FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_info.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

CREATE POLICY "Team members can update project info for owner projects"
ON public.project_info FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_info.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 16. PROCUREMENT ITEMS
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner procurement items"
ON public.procurement_items FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

-- ------------------------------------------------------------
-- 17. PROCUREMENT BUNDLES
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner procurement bundles"
ON public.procurement_bundles FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

-- ------------------------------------------------------------
-- 18. PROCUREMENT ITEM BUNDLES (via procurement_items)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner procurement item bundles"
ON public.procurement_item_bundles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.procurement_items pi
    WHERE pi.id = procurement_item_bundles.item_id
      AND pi.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 19. PROJECT PROCUREMENT ITEMS (via projects)
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner project procurement items"
ON public.project_procurement_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_procurement_items.project_id
      AND p.user_id = public.get_team_owner_id(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 20. LOAN PAYMENTS
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner loan payments"
ON public.loan_payments FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

-- ------------------------------------------------------------
-- 21. BUDGET TEMPLATES
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner budget templates"
ON public.budget_templates FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

-- ------------------------------------------------------------
-- 22. QUICKBOOKS EXPENSES
-- ------------------------------------------------------------
CREATE POLICY "Team members can view owner quickbooks expenses"
ON public.quickbooks_expenses FOR SELECT
USING (user_id = public.get_team_owner_id(auth.uid()));

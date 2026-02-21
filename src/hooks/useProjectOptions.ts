import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectOption {
  id: string;
  name: string;
  address?: string;
  status?: string;
  projectType?: string;
}

export function useProjectOptions() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name, address, status, project_type')
      .order('name')
      .then(({ data }) => {
        if (data) {
          setProjects(
            data.map((p) => ({
              id: p.id,
              name: p.name,
              address: p.address,
              status: p.status,
              projectType: p.project_type,
            })),
          );
        }
      });
  }, []);

  return projects;
}

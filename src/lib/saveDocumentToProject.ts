import { supabase } from '@/integrations/supabase/client';

export async function saveDocumentToProject(
  htmlContent: string,
  projectId: string,
  docType: string,
  category: string,
): Promise<void> {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const fileName = `${projectId}/${Date.now()}-${docType.toLowerCase().replace(/\s+/g, '-')}.html`;

  const { error: uploadError } = await supabase.storage
    .from('project-documents')
    .upload(fileName, blob);

  if (uploadError) throw uploadError;

  const dateLabel = new Date().toLocaleDateString();
  const { error: insertError } = await supabase.from('project_documents').insert({
    project_id: projectId,
    file_path: fileName,
    file_name: `${docType} - ${dateLabel}.html`,
    file_size: blob.size,
    category,
    document_date: new Date().toISOString().split('T')[0],
    title: `${docType} - ${dateLabel}`,
  });

  if (insertError) throw insertError;
}

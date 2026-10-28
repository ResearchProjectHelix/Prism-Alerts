import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { readAllPages } from '../lib/queryPaging';
import type { ClinicalDocument } from '../lib/types';

const BUCKET = 'clinical-documents';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 5;

export interface ScanWithUrl extends ClinicalDocument {
  fileUrl: string | null;
  fileState: 'not_loaded' | 'loading' | 'ready' | 'no_file' | 'unavailable';
}

/** Sign only the selected file, so its short-lived link is fresh when opened. */
export async function resolveScanFile(doc: ClinicalDocument): Promise<ScanWithUrl> {
  if (!doc.file_path) return { ...doc, fileUrl: null, fileState: 'no_file' };
  try {
    const { data, error } = await supabase.storage.from(BUCKET)
      .createSignedUrl(doc.file_path, SIGNED_URL_EXPIRY_SECONDS);
    const fileUrl = !error ? data?.signedUrl ?? null : null;
    return { ...doc, fileUrl, fileState: fileUrl ? 'ready' : 'unavailable' };
  } catch {
    return { ...doc, fileUrl: null, fileState: 'unavailable' };
  }
}

async function fetchScans(patientId: string): Promise<ScanWithUrl[]> {
  // Category identifies imaging; modality is kept in type. RLS controls visibility.
  const documents = await readAllPages<ClinicalDocument>((from, to) => supabase.from('documents')
    .select('*').eq('patient_id', patientId).eq('category', 'Imaging')
    .order('uploaded_at', { ascending: false }).order('id').range(from, to));
  return documents.map(doc => ({ ...doc, fileUrl: null, fileState: doc.file_path ? 'not_loaded' : 'no_file' }));
}

export function useDocuments(patientId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['scans', patientId, user?.id],
    queryFn: () => fetchScans(patientId),
    enabled: !!patientId && !!user,
    staleTime: 20_000,
  });
}

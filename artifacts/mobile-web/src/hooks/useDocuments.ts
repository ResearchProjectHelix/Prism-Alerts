import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { type ClinicalDocument } from '../lib/types';

const BUCKET = 'clinical-documents';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 5; // 5 minutes — generated fresh each load, never stored

export interface ScanWithUrl extends ClinicalDocument {
  fileUrl: string | null;
}

async function fetchScans(patientId: string): Promise<ScanWithUrl[]> {
  // Desktop stores modality in type; category identifies all imaging documents.
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patientId)
    .eq('category', 'Imaging')
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  const documents = (data ?? []) as ClinicalDocument[];

  const withUrls = await Promise.all(
    documents.map(async (doc) => {
      let fileUrl: string | null = null;
      if (doc.file_path) {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(doc.file_path, SIGNED_URL_EXPIRY_SECONDS);
        if (!signedError) fileUrl = signedData.signedUrl;
      }
      return { ...doc, fileUrl };
    }),
  );

  return withUrls;
}

export function useDocuments(patientId: string) {
  return useQuery({
    queryKey: ['scans', patientId],
    queryFn: () => fetchScans(patientId),
    enabled: !!patientId,
    staleTime: 20_000,
  });
}

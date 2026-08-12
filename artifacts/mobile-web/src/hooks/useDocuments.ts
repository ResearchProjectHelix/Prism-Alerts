import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { IMAGING_CATEGORIES, type ClinicalDocument } from '../lib/types';

const BUCKET = 'clinical-documents';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 5; // 5 minutes — generated fresh each load, never stored

export interface ScanWithUrl extends ClinicalDocument {
  fileUrl: string | null;
}

async function fetchScans(patientId: string): Promise<ScanWithUrl[]> {
  // Matches the imaging categories enforced by the "radiologists can insert
  // imaging documents" RLS policy on `documents` (category IN ('CT','MRI',
  // 'X-Ray','PET','Ultrasound')). NOTE: this differs from the DocumentCategory
  // enum in the desktop app's models/document.js, which defines `category` as
  // a broader Imaging/Pathology/Laboratory/etc value and puts the modality
  // (CT/MRI/PET) on a separate `type` field instead — see the flag raised
  // alongside this file about that mismatch.
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patientId)
    .in('category', IMAGING_CATEGORIES as unknown as string[])
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

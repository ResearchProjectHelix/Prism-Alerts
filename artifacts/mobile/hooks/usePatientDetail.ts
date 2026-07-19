import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildRules } from '@/lib/completeness';
import type { PatientDetail } from '@/lib/types';

async function fetchPatientDetail(patientId: string): Promise<PatientDetail> {
  const [patientResult, bloodsResult, reportsResult, timelineResult] =
    await Promise.all([
      supabase.from('patients').select('*').eq('id', patientId).single(),
      supabase
        .from('blood_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false }),
      supabase
        .from('reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('date', { ascending: false }),
      supabase
        .from('timeline_events')
        .select('*')
        .eq('patient_id', patientId)
        .order('sort_order'),
    ]);

  if (patientResult.error) throw patientResult.error;

  const patient = patientResult.data;
  const bloods = bloodsResult.data ?? [];
  const reports = reportsResult.data ?? [];
  const timeline = timelineResult.data ?? [];

  const rules = buildRules({
    bloods,
    reports,
    timeline,
    familyHistory: patient.family_history ?? null,
  });

  return { patient, rules, bloods, reports, timeline };
}

export function usePatientDetail(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetchPatientDetail(patientId),
    enabled: !!patientId,
    staleTime: 20_000,
  });
}

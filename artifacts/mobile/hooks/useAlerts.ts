import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildRules, getUnmetRules } from '@/lib/completeness';
import type { Alert } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

async function fetchAlerts(): Promise<Alert[]> {
  // Fetch all patients (scoped by RLS to the org)
  const { data: patients, error: pError } = await supabase
    .from('patients')
    .select('id, name, mrn, family_history')
    .order('name');

  if (pError) throw pError;
  if (!patients || patients.length === 0) return [];

  const patientIds = patients.map((p: { id: string }) => p.id);

  // Batch-fetch all related data
  const [bloodResult, reportResult, timelineResult] = await Promise.all([
    supabase
      .from('blood_tests')
      .select('id, patient_id, test, value, flag, unit, reference_range, recorded_at')
      .in('patient_id', patientIds),
    supabase
      .from('reports')
      .select('id, patient_id, type, date, status, document_id')
      .in('patient_id', patientIds),
    supabase
      .from('timeline_events')
      .select('id, patient_id, label, event_date, done, status, sort_order')
      .in('patient_id', patientIds)
      .order('sort_order'),
  ]);

  if (bloodResult.error) throw bloodResult.error;
  if (reportResult.error) throw reportResult.error;
  if (timelineResult.error) throw timelineResult.error;

  const allAlerts: Alert[] = [];

  for (const patient of patients) {
    const bloods = (bloodResult.data ?? []).filter(
      (b: { patient_id: string }) => b.patient_id === patient.id,
    );
    const reports = (reportResult.data ?? []).filter(
      (r: { patient_id: string }) => r.patient_id === patient.id,
    );
    const timeline = (timelineResult.data ?? []).filter(
      (t: { patient_id: string }) => t.patient_id === patient.id,
    );

    const rules = buildRules({
      bloods,
      reports,
      timeline,
      familyHistory: patient.family_history ?? null,
    });

    const unmet = getUnmetRules(rules);

    for (const rule of unmet) {
      allAlerts.push({
        id: `${patient.id}:${rule.key}`,
        patientId: patient.id,
        patientName: patient.name ?? 'Unknown',
        mrn: patient.mrn ?? '—',
        ruleKey: rule.key,
        ruleLabel: rule.label,
        priority: rule.priority,
      });
    }
  }

  // Sort: high priority first, then medium
  return allAlerts.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return 0;
  });
}

export function useAlerts() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    enabled: !!session,
    refetchInterval: 30_000, // poll every 30 seconds while app is open
    staleTime: 20_000,
  });
}

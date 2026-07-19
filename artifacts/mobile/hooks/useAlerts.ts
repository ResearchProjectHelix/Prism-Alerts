import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buildRules, getUnmetRules } from '@/lib/completeness';
import type { Alert } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

async function fetchAlerts(userId: string): Promise<Alert[]> {
  // 1. Check the user's profile for is_active and their org (for shared-patient detection)
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, is_active')
    .eq('user_id', userId)
    .single();

  if (profileError) throw profileError;

  // Deactivated account — throw a sentinel that the screen will handle
  if (profile && profile.is_active === false) {
    throw new Error('ACCOUNT_DEACTIVATED');
  }

  const userOrgId: string | null = profile?.organization_id ?? null;

  // 2. Fetch all patients visible to this user (scoped by RLS)
  const { data: patients, error: pError } = await supabase
    .from('patients')
    .select('id, name, mrn, family_history, organization_id')
    .order('name');

  if (pError) throw pError;
  if (!patients || patients.length === 0) return [];

  const patientIds = patients.map((p: { id: string }) => p.id);

  // 3. Batch-fetch all related data
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

    // A patient is "shared in" when their org differs from the current user's org.
    // Gracefully falls back to false when org info is unavailable.
    const isShared = Boolean(
      userOrgId &&
        patient.organization_id &&
        patient.organization_id !== userOrgId,
    );

    for (const rule of unmet) {
      allAlerts.push({
        id: `${patient.id}:${rule.key}`,
        patientId: patient.id,
        patientName: patient.name ?? 'Unknown',
        mrn: patient.mrn ?? '—',
        ruleKey: rule.key,
        ruleLabel: rule.label,
        priority: rule.priority,
        isShared,
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
  const { session, user } = useAuth();

  return useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled: !!session && !!user,
    refetchInterval: 30_000, // poll every 30 seconds while app is open
    staleTime: 20_000,
  });
}

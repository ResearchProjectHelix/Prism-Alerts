import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { BloodResultGroup, BloodTest } from '../lib/types';

/**
 * Groups a flat list of blood_tests rows by test name, matching the
 * grouping logic in Project-Helix/src/renderer/pages/BloodResults.jsx
 * (groupByTest). Each group is sorted most-recent-first, and `latest`
 * is the first (most recent) entry.
 */
function groupByTest(bloods: BloodTest[]): BloodResultGroup[] {
  const groups = new Map<string, BloodTest[]>();

  for (const b of bloods) {
    if (!groups.has(b.test)) {
      groups.set(b.test, []);
    }
    groups.get(b.test)!.push(b);
  }

  const result: BloodResultGroup[] = [];
  for (const [testName, history] of groups) {
    const sorted = [...history].sort((a, b) => {
      const aTime = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const bTime = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      return bTime - aTime;
    });
    result.push({
      testName,
      unit: sorted[0]?.unit ?? null,
      referenceRange: sorted[0]?.reference_range ?? null,
      history: sorted,
      latest: sorted[0],
    });
  }

  return result.sort((a, b) => a.testName.localeCompare(b.testName));
}

async function fetchBloodResults(patientId: string): Promise<BloodResultGroup[]> {
  const { data, error } = await supabase
    .from('blood_tests')
    .select('id, patient_id, test, value, flag, unit, reference_range, recorded_at')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return groupByTest(data ?? []);
}

export function useBloodResults(patientId: string) {
  return useQuery({
    queryKey: ['blood-results', patientId],
    queryFn: () => fetchBloodResults(patientId),
    enabled: !!patientId,
    staleTime: 20_000,
  });
}

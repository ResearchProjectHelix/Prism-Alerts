import type { PatientIdentityData } from '../hooks/usePatientIdentity';
import { colors } from '../lib/colors';

export function PatientIdentity({ patient, loading, error, onRetry }: {
  patient?: PatientIdentityData; loading: boolean; error: boolean; onRetry: () => void;
}) {
  if (error) return <div role="alert" style={{ marginTop: 10 }}>
    <p style={{ color: colors.destructive, fontSize: 13 }}>Couldn't confirm this patient's identity.</p>
    <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={onRetry}>Try again</button>
  </div>;
  if (loading || !patient) return <div role="status" style={{ marginTop: 10, color: colors.mutedForeground }}>Loading patient…</div>;
  return <div aria-label="Patient identity" style={{ marginTop: 10, minWidth: 0, overflowWrap: 'anywhere' }}>
    <div style={{ fontSize: 17, fontWeight: 700 }}>{patient.name}</div>
    <div style={{ fontSize: 13, color: colors.mutedForeground }}>MRN: {patient.mrn || 'Not recorded'}
      {patient.isShared && ' · Shared record (read-only)'}
    </div>
  </div>;
}

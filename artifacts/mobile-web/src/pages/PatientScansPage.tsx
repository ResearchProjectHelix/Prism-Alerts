import { usePatientIdentity } from '../hooks/usePatientIdentity';
import { PatientIdentity } from '../components/PatientIdentity';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocuments, resolveScanFile, type ScanWithUrl } from '../hooks/useDocuments';
import { PatientTabs } from '../components/PatientTabs';
import { ScanViewer } from '../components/ScanViewer';
import { colors } from '../lib/colors';

export function PatientScansPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: identity, isLoading: identityLoading, error: identityError, refetch: retryIdentity } = usePatientIdentity(id ?? '');
  const hasIdentity = !!identity && !identityError;
  const { data: scans, isLoading, isFetching, error, refetch } = useDocuments(id ?? '');
  const [viewing, setViewing] = useState<ScanWithUrl | null>(null);
  const selectionVersion = useRef(0);
  useEffect(() => {
    selectionVersion.current += 1;
    setViewing(null);
    return () => { selectionVersion.current += 1; };
  }, [id]);
  const closeViewer = useCallback(() => { selectionVersion.current += 1; setViewing(null); }, []);
  const openScan = async (scan: ScanWithUrl) => {
    const version = ++selectionVersion.current;
    setViewing({ ...scan, fileUrl: null, fileState: scan.file_path ? 'loading' : 'no_file' });
    const resolved = await resolveScanFile(scan);
    if (version === selectionVersion.current) setViewing(resolved);
  };

  return (
    <div className="connect-page" style={{ minHeight: '100dvh', backgroundColor: colors.background, color: colors.foreground }}>
      <header className="connect-header" style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => navigate(`/patient/${id}`)}
          style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, padding: 0, cursor: 'pointer' }}
        >
          &larr; Overview
        </button>
        <PatientIdentity patient={identity} loading={identityLoading} error={!!identityError} onRetry={() => void retryIdentity()} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Scans</div>
          <button className="btn btn-ghost" disabled={isFetching} onClick={() => void refetch()} style={{ width: 'auto', paddingInline: 14 }}>Refresh files</button>
        </div>
      </header>

      {id && <PatientTabs patientId={id} />}

      {hasIdentity && <>
      {isLoading && <div style={{ padding: 40, textAlign: 'center', color: colors.mutedForeground }}>Loading…</div>}
      {error && (
        <div style={{ padding: 40, textAlign: 'center', color: colors.destructive }}>
          Couldn't load scans.
        </div>
      )}
      {scans && scans.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: colors.mutedForeground }}>
          No imaging scans uploaded yet.
        </div>
      )}

      {scans && scans.length > 0 && (
        <div className="connect-card-grid" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scans.map((scan) => (
            <button
              className="connect-scan-row"
              key={scan.id}
              onClick={() => void openScan(scan)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '14px 16px',
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{scan.name}</div>
                <div style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  {scan.type || scan.category}
                  {scan.doc_date ? ` \u00b7 ${scan.doc_date}` : ''}
                  {scan.clinician ? ` \u00b7 ${scan.clinician}` : ''}
                </div>
              </div>
              <span style={{ color: scan.file_path ? colors.primary : colors.mutedForeground, fontSize: 13, flexShrink: 0 }}>
                {scan.fileState === 'no_file' ? 'No file attached' : 'Open file →'}
              </span>
            </button>
          ))}
        </div>
      )}

      {viewing && viewing.patient_id === id && <ScanViewer patientLabel={`${identity!.name} · ${identity!.mrn || 'MRN not recorded'}`} doc={viewing} onClose={closeViewer} />}
      </>}
    </div>
  );
}

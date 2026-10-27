import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { colors } from '../lib/colors';

export function PatientsPage() {
  const { data: patients, isLoading, error, refetch } = usePatients();
  const [search, setSearch] = useState('');
  const term = search.trim().toLocaleLowerCase();
  const visible = patients?.filter(patient =>
    `${patient.name} ${patient.mrn ?? ''}`.toLocaleLowerCase().includes(term));

  return (
    <main className="connect-page" style={{ minHeight: '100dvh', background: colors.background, color: colors.foreground }}>
      <header className="connect-header" style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <Link to="/alerts" style={{ color: colors.primary, display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>← Alerts</Link>
        <h1 style={{ fontSize: 20, margin: '8px 0' }}>Patients</h1>
        <p style={{ color: colors.mutedForeground, fontSize: 13, margin: 0 }}>All patient records you have access to, including those without open alerts.</p>
      </header>
      <div style={{ padding: 20 }}>
        <label htmlFor="patient-search" className="field__label">Search by name or MRN</label>
        <input id="patient-search" type="search" className="input" value={search} onChange={event => setSearch(event.target.value)}
          placeholder="Patient name or MRN" style={{ marginTop: 8, fontSize: 16 }} />
      </div>
      {isLoading && <p role="status" className="loading-state">Loading patients…</p>}
      {error && <div role="alert" className="error-state">Couldn’t load the patient directory.
        <button className="btn btn-ghost" onClick={() => void refetch()} style={{ marginTop: 12, maxWidth: 240 }}>Try again</button>
      </div>}
      {!error && patients && <p role="status" style={{ padding: '0 20px', color: colors.mutedForeground, fontSize: 13 }}>
        {visible?.length} of {patients.length} patients
      </p>}
      {!error && visible?.length === 0 && <p className="empty-state">{term ? 'No patients match your search.' : 'No patient records are available to this account.'}</p>}
      {!error && <div className="connect-alert-grid">{visible?.map(patient => (
        <Link key={patient.id} to={`/patient/${patient.id}`} className="list-row connect-alert-row" style={{ textDecoration: 'none', overflowWrap: 'anywhere' }}>
          <div style={{ minWidth: 0 }}>
            <div className="list-row__title">{patient.name}</div>
            <div className="list-row__meta">{patient.mrn || 'MRN not recorded'}{patient.isShared && ' · Shared record'}</div>
          </div>
        </Link>
      ))}</div>}
    </main>
  );
}

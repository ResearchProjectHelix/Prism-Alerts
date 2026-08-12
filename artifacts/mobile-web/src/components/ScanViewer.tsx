import type { ScanWithUrl } from '../hooks/useDocuments';
import { colors } from '../lib/colors';

function isPdf(doc: ScanWithUrl): boolean {
  return (doc.file_name ?? '').toLowerCase().endsWith('.pdf');
}

function isImage(doc: ScanWithUrl): boolean {
  return /\.(png|jpe?g|gif|webp)$/i.test(doc.file_name ?? '');
}

export function ScanViewer({ doc, onClose }: { doc: ScanWithUrl; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000cc',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px',
          backgroundColor: colors.surface,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div style={{ color: colors.foreground, fontWeight: 600, fontSize: 14 }}>
            {doc.name}
          </div>
          <div style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {doc.type} {doc.doc_date ? `\u00b7 ${doc.doc_date}` : ''}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colors.mutedForeground,
            fontSize: 22,
            cursor: 'pointer',
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <div
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {!doc.fileUrl && (
          <span style={{ color: colors.mutedForeground }}>
            This file couldn't be loaded (the signed link may have expired \u2014 close and reopen).
          </span>
        )}
        {doc.fileUrl && isPdf(doc) && (
          <iframe
            src={doc.fileUrl}
            title={doc.name}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
        {doc.fileUrl && isImage(doc) && (
          <img
            src={doc.fileUrl}
            alt={doc.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        )}
        {doc.fileUrl && !isPdf(doc) && !isImage(doc) && (
          <div style={{ textAlign: 'center', color: colors.mutedForeground, padding: 24 }}>
            <p>This file type can't be previewed inline.</p>
            <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: colors.primary }}>
              Open in a new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

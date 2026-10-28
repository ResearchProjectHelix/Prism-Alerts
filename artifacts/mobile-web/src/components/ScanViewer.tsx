import { useEffect, useRef } from 'react';
import type { ScanWithUrl } from '../hooks/useDocuments';
import { colors } from '../lib/colors';

function isPdf(doc: ScanWithUrl): boolean {
  return (doc.file_name ?? '').toLowerCase().endsWith('.pdf');
}

function isImage(doc: ScanWithUrl): boolean {
  return /\.(png|jpe?g|gif|webp)$/i.test(doc.file_name ?? '');
}

export function ScanViewer({ doc, onClose }: { doc: ScanWithUrl; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = dialog.current;
    if (modal && !modal.open) modal.showModal();
    closeButton.current?.focus();
    return () => { modal?.close(); previousFocus?.focus(); };
  }, [onClose]);
  return (
    <dialog ref={dialog} className="scan-viewer-dialog" role="dialog" aria-label={doc.name}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      style={{
        position: 'fixed',
        margin: 0, padding: 0, border: 0,
        width: '100vw', height: '100dvh', maxWidth: 'none', maxHeight: 'none',
        inset: 0,
        backgroundColor: '#000000cc',
        zIndex: 50,
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
        <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          <div style={{ color: colors.foreground, fontWeight: 600, fontSize: 14 }}>
            {doc.name}
          </div>
          <div style={{ color: colors.mutedForeground, fontSize: 12 }}>
            {doc.type} {doc.doc_date ? `\u00b7 ${doc.doc_date}` : ''}
          </div>
        </div>
        <button
          ref={closeButton}
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colors.mutedForeground,
            fontSize: 22,
            cursor: 'pointer',
            lineHeight: 1,
            minWidth: 44, minHeight: 44, flexShrink: 0,
          }}
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <div
        style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {!doc.fileUrl && (
          <span style={{ color: colors.mutedForeground }}>
            {doc.fileState === 'no_file'
              ? 'This record has no file attached. It does not provide a viewable scan.'
              : 'The file is currently unavailable. Close this viewer and use Refresh files to request a new link.'}
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
    </dialog>
  );
}

import React, { useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';

interface CreateArticleModalProps { isOpen: boolean; onClose: () => void }

export const CreateArticleModal: React.FC<CreateArticleModalProps> = ({ isOpen, onClose }) => {
  const { importArticle } = useArticles();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) { setError('Select an NZZ JSON or Markdown article file.'); return; }
    if (!/\.(json|md)$/i.test(file.name)) { setError('Only .json and .md files are supported.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const outcome = await importArticle(file);
      setMessage(outcome.status === 'imported' ? 'Article imported successfully.' : outcome.reason || 'Article already exists.');
      setTimeout(onClose, 500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to import article');
    } finally { setBusy(false); }
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-window editor-modal import-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-header">
        <div className="modal-title-wrap">
          <div className="modal-icon-badge editor"><FileUp size={20} /></div>
          <div><h2 className="modal-title">Import Article</h2><p className="modal-subtitle">Upload a structured NZZ JSON or Markdown document</p></div>
        </div>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
      </div>
      {error && <div className="form-error-banner">{error}</div>}
      {message && <div className="import-success-banner">{message}</div>}
      <form onSubmit={submit} className="editor-scroll-body article-import-form">
        <label className="article-file-drop">
          <FileUp size={32} />
          <strong>{file ? file.name : 'Choose an article file'}</strong>
          <span>Supported formats: .json, .md · Maximum size: 5 MB</span>
          <input type="file" accept=".json,.md,application/json,text/markdown" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <p className="helper-text">JSON files must follow the supplied NZZ article structure. Markdown requires a headline and article body; optional front matter can provide author, section, language, date, and source URL.</p>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-publish-primary" disabled={busy}>{busy ? 'Importing…' : 'Import Article'}</button>
        </div>
      </form>
    </div>
  </div>;
};

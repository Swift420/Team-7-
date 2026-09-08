import React, { useState } from 'react';
import { BarChart3, FilePenLine, FileUp, LoaderCircle, X } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';

interface CreateArticleModalProps { isOpen: boolean; mode: 'import' | 'create'; onClose: () => void }

export const CreateArticleModal: React.FC<CreateArticleModalProps> = ({ isOpen, mode, onClose }) => {
  const { importArticle, openArticle } = useArticles();
  const [file, setFile] = useState<File | null>(null);
  const [headline, setHeadline] = useState(''); const [lead, setLead] = useState(''); const [author, setAuthor] = useState(''); const [section, setSection] = useState(''); const [body, setBody] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  if (!isOpen) return null;

  const submitImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) { setError('Select an NZZ JSON or Markdown article file.'); return; }
    if (!/\.(json|md)$/i.test(file.name)) { setError('Only .json and .md files are supported.'); return; }
    setBusy(true); setError(''); setMessage('');
    try { const outcome = await importArticle(file); setMessage(outcome.status === 'imported' ? 'Article imported successfully.' : outcome.reason || 'Article already exists.'); setTimeout(onClose, 500); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to import article'); } finally { setBusy(false); }
  };

  const submitCreate = async (visualize: boolean) => {
    if (!headline.trim() || !body.trim()) { setError('Headline and article body are required.'); return; }
    setBusy(true); setError('');
    try {
      const metadata = [`title: ${headline.trim()}`, lead.trim() ? `lead: ${lead.trim()}` : '', author.trim() ? `author: ${author.trim()}` : '', section.trim() ? `section: ${section.trim()}` : '', `published_at: ${new Date().toISOString().slice(0, 10)}`].filter(Boolean).join('\n');
      const markdown = `---\n${metadata}\n---\n\n# ${headline.trim()}\n\n${lead.trim() ? `*${lead.trim()}*\n\n` : ''}${body.trim()}`;
      const safeName = headline.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'article';
      const outcome = await importArticle(new File([markdown], `${safeName}.md`, { type: 'text/markdown' }));
      if (visualize) {
        // Put the intent in the URL before mounting the article page so the
        // visualizer can start as soon as the newly created article loads.
        window.history.pushState({}, '', `/articles/${outcome.article.id}?visualize=1`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      onClose();
      await openArticle(outcome.article.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create article'); } finally { setBusy(false); }
  };

  return <div className="modal-backdrop" onClick={onClose}><div className="modal-window editor-modal import-modal create-article-modal" onClick={(event) => event.stopPropagation()}>
    <div className="modal-header"><div className="modal-title-wrap"><div className="modal-icon-badge editor">{mode === 'create' ? <FilePenLine size={20} /> : <FileUp size={20} />}</div><div><h2 className="modal-title">{mode === 'create' ? 'Create Article' : 'Import Article'}</h2><p className="modal-subtitle">{mode === 'create' ? 'Write and save a new article' : 'Upload a structured NZZ JSON or Markdown document'}</p></div></div><button className="modal-close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
    {error && <div className="form-error-banner">{error}</div>}{message && <div className="import-success-banner">{message}</div>}
    {mode === 'import' ? <form onSubmit={submitImport} className="editor-scroll-body article-import-form"><label className="article-file-drop"><FileUp size={32} /><strong>{file ? file.name : 'Choose an article file'}</strong><span>Supported formats: .json, .md · Maximum size: 5 MB</span><input type="file" accept=".json,.md,application/json,text/markdown" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><p className="helper-text">JSON files must follow the supplied NZZ article structure. Markdown requires a headline and article body; optional front matter can provide author, section, language, date, and source URL.</p><div className="modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-publish-primary" disabled={busy}>{busy ? 'Importing…' : 'Import Article'}</button></div></form> : <div className="editor-scroll-body create-article-form">
      <label>Headline<input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Write a clear headline" autoFocus /></label><label>Lead <span className="field-hint">optional</span><textarea value={lead} onChange={(event) => setLead(event.target.value)} rows={2} placeholder="A short introduction" /></label><div className="create-form-grid"><label>Author <span className="field-hint">optional</span><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author name" /></label><label>Section <span className="field-hint">optional</span><input value={section} onChange={(event) => setSection(event.target.value)} placeholder="News, Data, Culture…" /></label></div><label>Article body<textarea className="create-body-input" value={body} onChange={(event) => setBody(event.target.value)} rows={12} placeholder="Write or paste the article here…" /></label><div className="modal-footer create-modal-footer"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-publish-primary" disabled={busy} onClick={() => void submitCreate(false)}>{busy ? <LoaderCircle className="spin" size={16} /> : <FilePenLine size={16} />} Save Article</button><button type="button" className="visualize-article-button" disabled={busy} onClick={() => void submitCreate(true)}>{busy ? <LoaderCircle className="spin" size={16} /> : <BarChart3 size={16} />} Visualize Article</button></div>
    </div>}
  </div></div>;
};

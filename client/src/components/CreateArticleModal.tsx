import React, { useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle2, FilePenLine, FileUp, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import { lintText } from '../services/liquidApi';

interface CreateArticleModalProps {
  isOpen: boolean;
  mode: 'import' | 'create';
  onClose: () => void;
}

export const CreateArticleModal: React.FC<CreateArticleModalProps> = ({
  isOpen,
  mode,
  onClose,
}) => {
  const { importArticle, openArticle } = useArticles();
  const [file, setFile] = useState<File | null>(null);
  const [headline, setHeadline] = useState('');
  const [lead, setLead] = useState('');
  const [author, setAuthor] = useState('');
  const [section, setSection] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // NZZ Style Linter state
  const [lintReport, setLintReport] = useState<{
    valid: boolean;
    warnings: string[];
    checked: boolean;
  } | null>(null);
  const [isLinting, setIsLinting] = useState(false);

  if (!isOpen) return null;

  const submitImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError('Select an NZZ JSON or Markdown article file.');
      return;
    }
    if (!/\.(json|md)$/i.test(file.name)) {
      setError('Only .json and .md files are supported.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const outcome = await importArticle(file);
      setMessage(
        outcome.status === 'imported'
          ? 'Article imported successfully.'
          : outcome.reason || 'Article already exists.'
      );
      setTimeout(onClose, 500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to import article');
    } finally {
      setBusy(false);
    }
  };

  const handleLintCheck = async () => {
    if (!headline.trim() && !body.trim()) {
      setError('Please enter a headline or article body before linting.');
      return;
    }
    setIsLinting(true);
    setError('');
    try {
      const headlineRes = await lintText({ text: headline, isHeadline: true });
      const bodyRes = await lintText({ text: `${lead} ${body}` });
      const combinedWarnings = Array.from(
        new Set([...(headlineRes.warnings || []), ...(bodyRes.warnings || [])])
      );
      setLintReport({
        valid: combinedWarnings.length === 0,
        warnings: combinedWarnings,
        checked: true,
      });
    } catch (err: any) {
      setError(err.message || 'Style check failed');
    } finally {
      setIsLinting(false);
    }
  };

  const submitCreate = async (visualize: boolean) => {
    if (!headline.trim() || !body.trim()) {
      setError('Headline and article body are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const metadata = [
        `title: ${headline.trim()}`,
        lead.trim() ? `lead: ${lead.trim()}` : '',
        author.trim() ? `author: ${author.trim()}` : '',
        section.trim() ? `section: ${section.trim()}` : '',
        `published_at: ${new Date().toISOString().slice(0, 10)}`,
      ]
        .filter(Boolean)
        .join('\n');
      const markdown = `---\n${metadata}\n---\n\n# ${headline.trim()}\n\n${
        lead.trim() ? `*${lead.trim()}*\n\n` : ''
      }${body.trim()}`;
      const safeName =
        headline
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'article';
      const outcome = await importArticle(
        new File([markdown], `${safeName}.md`, { type: 'text/markdown' }),
        true
      );
      if (visualize) {
        window.history.pushState({}, '', `/articles/${outcome.article.id}?visualize=1`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      onClose();
      await openArticle(outcome.article.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create article');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window nzz-editor-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nzz-dialog-header">
          <div className="nzz-dialog-title-wrap">
            <span className="nzz-dialog-kicker">
              {mode === 'create' ? <FilePenLine size={13} /> : <FileUp size={13} />}
              {mode === 'create' ? 'NZZ REDAKTION · NEUER ARTIKEL' : 'NZZ DATEN · IMPORT'}
            </span>
            <h2 className="nzz-dialog-headline">
              {mode === 'create' ? 'Neuen Artikel verfassen' : 'NZZ Datensatz importieren'}
            </h2>
            <p className="nzz-dialog-sub">
              {mode === 'create'
                ? 'Schreiben Sie Ihren Text, prüfen Sie die NZZ Stilrichtlinien und erkennen Sie Visualisierungschancen.'
                : 'Laden Sie eine strukturierte NZZ JSON-Datei oder Markdown-Exportdatei hoch.'}
            </p>
          </div>
          <button className="nzz-dialog-close" onClick={onClose} aria-label="Schliessen">
            <X size={18} />
          </button>
        </div>

        {error && <div className="nzz-dialog-error">{error}</div>}
        {message && <div className="nzz-dialog-success">{message}</div>}

        {mode === 'import' ? (
          <form onSubmit={submitImport} className="nzz-editor-form">
            <label className="nzz-file-dropzone">
              <FileUp size={36} className="text-red-600 mb-2" />
              <strong>{file ? file.name : 'NZZ JSON- oder Markdown-Datei auswählen'}</strong>
              <span>Unterstützte Formate: .json, .md · Maximal 5 MB</span>
              <input
                type="file"
                accept=".json,.md,application/json,text/markdown"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <p className="nzz-dialog-hint">
              JSON-Dateien müssen der NZZ Content-Struktur entsprechen. Markdown unterstützt
              Titel, Lead, Floskel-Prüfung und Frontmatter.
            </p>
            <div className="nzz-dialog-actions">
              <button type="button" className="nzz-btn-cancel" onClick={onClose}>
                Abbrechen
              </button>
              <button type="submit" className="nzz-btn-submit-red" disabled={busy}>
                {busy ? 'Wird importiert…' : 'Artikel importieren'}
              </button>
            </div>
          </form>
        ) : (
          <div className="nzz-editor-form">
            <div className="nzz-field-group">
              <label className="nzz-field-label">Titel / Schlagzeile *</label>
              <input
                className="nzz-text-input font-serif text-base"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Schlagzeile im NZZ-Stil verfassen…"
                autoFocus
              />
            </div>

            <div className="nzz-field-group">
              <label className="nzz-field-label">Lead / Vorspann (optional)</label>
              <textarea
                className="nzz-textarea text-sm"
                value={lead}
                onChange={(event) => setLead(event.target.value)}
                rows={2}
                placeholder="Einleitender Absatz mit Hauptthese…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="nzz-field-group">
                <label className="nzz-field-label">Autor / Redaktor (optional)</label>
                <input
                  className="nzz-text-input text-sm"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder="z. B. Beat Gygi, Zürich"
                />
              </div>
              <div className="nzz-field-group">
                <label className="nzz-field-label">Ressort (optional)</label>
                <input
                  className="nzz-text-input text-sm"
                  value={section}
                  onChange={(event) => setSection(event.target.value)}
                  placeholder="Wirtschaft, International, Schweiz…"
                />
              </div>
            </div>

            <div className="nzz-field-group">
              <label className="nzz-field-label">Artikeltext *</label>
              <textarea
                className="nzz-textarea font-serif text-sm leading-relaxed"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={9}
                placeholder="Vollständigen Text hier einfügen oder schreiben…"
              />
            </div>

            {/* NZZ Style Linter Feedback Banner */}
            {lintReport && (
              <div
                className={`p-3.5 border text-xs my-2 ${
                  lintReport.valid
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {lintReport.valid ? (
                    <>
                      <CheckCircle2 size={15} className="text-emerald-700" />
                      <span>NZZ Stilrichtlinien bestanden (100% Konform)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={15} className="text-amber-700" />
                      <span>NZZ Stilempfehlungen:</span>
                    </>
                  )}
                </div>
                {lintReport.warnings.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-1 text-[11px] text-amber-900">
                    {lintReport.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="nzz-dialog-actions flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-zinc-200">
              <div className="flex items-center gap-2">
                <button type="button" className="nzz-btn-cancel" onClick={onClose}>
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="nzz-btn-lint"
                  disabled={isLinting}
                  onClick={handleLintCheck}
                  title="NZZ Stilrichtlinien prüfen"
                >
                  {isLinting ? (
                    <LoaderCircle className="spin" size={14} />
                  ) : (
                    <ShieldCheck size={14} className="text-red-600" />
                  )}
                  <span>NZZ-Stil prüfen</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="nzz-btn-action dark"
                  disabled={busy}
                  onClick={() => void submitCreate(false)}
                >
                  {busy ? <LoaderCircle className="spin" size={14} /> : <FilePenLine size={14} />}
                  <span>Entwurf speichern</span>
                </button>

                <button
                  type="button"
                  className="nzz-btn-submit-red"
                  disabled={busy}
                  onClick={() => void submitCreate(true)}
                >
                  {busy ? <LoaderCircle className="spin" size={14} /> : <BarChart3 size={14} />}
                  <span>Speichern &amp; Visualisieren</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

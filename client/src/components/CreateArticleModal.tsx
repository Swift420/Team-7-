import React, { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Camera,
  CheckCircle2,
  FilePenLine,
  FileUp,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useArticles } from '../hooks/useArticles';
import { useLanguage } from '../hooks/useLanguage';
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
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [file, setFile] = useState<File | null>(null);
  const [headline, setHeadline] = useState('');
  const [lead, setLead] = useState('');
  const [author, setAuthor] = useState('');
  const [section, setSection] = useState('');
  const [body, setBody] = useState('');

  // Journalist Lead Photo state
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageCredit, setImageCredit] = useState('');

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

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError(isEn ? 'Please select a valid image file (JPG, PNG, WebP).' : 'Bitte eine gültige Bilddatei (JPG, PNG, WebP) auswählen.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageUrl(result);
    };
    reader.readAsDataURL(selected);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setImageUrl('');
    setImageCaption('');
    setImageCredit('');
  };

  const submitImport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError(isEn ? 'Select an NZZ JSON or Markdown article file.' : 'Wählen Sie eine NZZ JSON- oder Markdown-Artikeldatei aus.');
      return;
    }
    if (!/\.(json|md)$/i.test(file.name)) {
      setError(isEn ? 'Only .json and .md files are supported.' : 'Nur .json- und .md-Dateien werden unterstützt.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const outcome = await importArticle(file);
      setMessage(
        outcome.status === 'imported'
          ? (isEn ? 'Article imported successfully.' : 'Artikel erfolgreich importiert.')
          : outcome.reason || (isEn ? 'Article already exists.' : 'Artikel existiert bereits.')
      );
      setTimeout(onClose, 500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isEn ? 'Unable to import article' : 'Artikel konnte nicht importiert werden'));
    } finally {
      setBusy(false);
    }
  };

  const handleLintCheck = async () => {
    if (!headline.trim() && !body.trim()) {
      setError(isEn ? 'Please enter a headline or article body before linting.' : 'Bitte vor dem Prüfen Titel oder Text eingeben.');
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
      setError(err.message || (isEn ? 'Style check failed' : 'Stilprüfung fehlgeschlagen'));
    } finally {
      setIsLinting(false);
    }
  };

  const submitCreate = async (visualize: boolean) => {
    if (!headline.trim() || !body.trim()) {
      setError(isEn ? 'Headline and article body are required.' : 'Titel und Artikeltext sind erforderlich.');
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
        imageUrl.trim() ? `image_url: ${imageUrl.trim()}` : '',
        imageCaption.trim() ? `image_caption: ${imageCaption.trim()}` : '',
        imageCredit.trim() ? `image_credit: ${imageCredit.trim()}` : '',
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
      setError(cause instanceof Error ? cause.message : (isEn ? 'Unable to create article' : 'Artikel konnte nicht erstellt werden'));
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
              {mode === 'create'
                ? (isEn ? 'NZZ EDITORIAL · NEW ARTICLE' : 'NZZ REDAKTION · NEUER ARTIKEL')
                : (isEn ? 'NZZ DATA · IMPORT' : 'NZZ DATEN · IMPORT')}
            </span>
            <h2 className="nzz-dialog-headline">
              {mode === 'create'
                ? (isEn ? 'Compose New Article' : 'Neuen Artikel verfassen')
                : (isEn ? 'Import NZZ Dataset' : 'NZZ Datensatz importieren')}
            </h2>
            <p className="nzz-dialog-sub">
              {mode === 'create'
                ? (isEn
                    ? 'Write your piece, attach editorial photography, run NZZ style linting, and explore data visualisations.'
                    : 'Schreiben Sie Ihren Text, fügen Sie redaktionelle Fotos an, prüfen Sie die NZZ Stilrichtlinien und erkennen Sie Visualisierungen.')
                : (isEn
                    ? 'Upload a structured NZZ JSON file or Markdown export file.'
                    : 'Laden Sie eine strukturierte NZZ JSON-Datei oder Markdown-Exportdatei hoch.')}
            </p>
          </div>
          <button className="nzz-dialog-close" onClick={onClose} aria-label={isEn ? 'Close' : 'Schliessen'}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="nzz-dialog-error">{error}</div>}
        {message && <div className="nzz-dialog-success">{message}</div>}

        {mode === 'import' ? (
          <form onSubmit={submitImport} className="nzz-editor-form">
            <label className="nzz-file-dropzone">
              <FileUp size={36} className="text-red-600 mb-2" />
              <strong>{file ? file.name : (isEn ? 'Select NZZ JSON or Markdown file' : 'NZZ JSON- oder Markdown-Datei auswählen')}</strong>
              <span>{isEn ? 'Supported formats: .json, .md · Max 5 MB' : 'Unterstützte Formate: .json, .md · Maximal 5 MB'}</span>
              <input
                type="file"
                accept=".json,.md,application/json,text/markdown"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
            <p className="nzz-dialog-hint">
              {isEn
                ? 'JSON files must conform to the NZZ content structure. Markdown supports title, lead, frontmatter, and style linting.'
                : 'JSON-Dateien müssen der NZZ Content-Struktur entsprechen. Markdown unterstützt Titel, Lead, Floskel-Prüfung und Frontmatter.'}
            </p>
            <div className="nzz-dialog-actions">
              <button type="button" className="nzz-btn-cancel" onClick={onClose}>
                {isEn ? 'Cancel' : 'Abbrechen'}
              </button>
              <button type="submit" className="nzz-btn-submit-red" disabled={busy}>
                {busy ? (isEn ? 'Importing…' : 'Wird importiert…') : (isEn ? 'Import Article' : 'Artikel importieren')}
              </button>
            </div>
          </form>
        ) : (
          <div className="nzz-editor-form">
            <div className="nzz-field-group">
              <label className="nzz-field-label">{isEn ? 'Title / Headline *' : 'Titel / Schlagzeile *'}</label>
              <input
                className="nzz-text-input font-serif text-base"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder={isEn ? 'Compose headline in authentic NZZ style…' : 'Schlagzeile im NZZ-Stil verfassen…'}
                autoFocus
              />
            </div>

            <div className="nzz-field-group">
              <label className="nzz-field-label">{isEn ? 'Lead / Subtitle (optional)' : 'Lead / Vorspann (optional)'}</label>
              <textarea
                className="nzz-textarea text-sm"
                value={lead}
                onChange={(event) => setLead(event.target.value)}
                rows={2}
                placeholder={isEn ? 'Introductory thesis and analytical premise…' : 'Einleitender Absatz mit Hauptthese…'}
              />
            </div>

            {/* Journalist Editorial Photo Upload Box */}
            <div className="nzz-image-upload-section">
              <div className="nzz-image-upload-header">
                <span className="nzz-image-upload-title">
                  <Camera size={14} className="text-red-600" />
                  {isEn ? 'Editorial Lead Photography' : 'Redaktionelles Hauptbild'}
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {isEn ? 'Journalist Upload' : 'Journalisten-Upload'}
                </span>
              </div>
              <p className="nzz-image-upload-desc">
                {isEn
                  ? 'Attach your own authentic photography for the newspaper website. (AI generation is strictly reserved for external social carousels and exports).'
                  : 'Laden Sie Ihr eigenes redaktionelles Foto für die Zeitungs-Website hoch. (KI-Generierung ist ausschliesslich für externe Social-Media-Karusselle reserviert).'}
              </p>

              {imagePreview ? (
                <div className="nzz-image-preview-wrap">
                  <img src={imagePreview} alt="Article lead preview" className="nzz-image-preview-img" />
                  <button
                    type="button"
                    className="nzz-image-remove-btn"
                    onClick={handleRemoveImage}
                    title={isEn ? 'Remove image' : 'Bild entfernen'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <label className="nzz-image-dropzone">
                  <Upload size={22} className="text-zinc-500 mb-1.5" />
                  <span className="text-xs font-bold text-zinc-900">
                    {isEn ? 'Click to select photo or drag here' : 'Foto auswählen oder hierher ziehen'}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">
                    {isEn ? 'PNG, JPG, WebP up to 10 MB' : 'PNG, JPG, WebP bis zu 10 MB'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                  />
                </label>
              )}

              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 shrink-0 font-medium">{isEn ? 'Or image URL:' : 'Oder Bild-URL:'}</span>
                  <input
                    className="nzz-text-input text-xs py-1"
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImageUrl(val);
                      setImagePreview(val);
                    }}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="nzz-image-meta-grid">
                  <input
                    className="nzz-text-input text-xs py-1"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder={isEn ? 'Caption (e.g. Bundeshaus Bern…)' : 'Bildlegende (z. B. Bundeshaus Bern…)'}
                  />
                  <input
                    className="nzz-text-input text-xs py-1"
                    value={imageCredit}
                    onChange={(e) => setImageCredit(e.target.value)}
                    placeholder={isEn ? 'Credit (e.g. Keystone, Reuters)' : 'Bildquelle (z. B. Keystone, Reuters)'}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="nzz-field-group">
                <label className="nzz-field-label">{isEn ? 'Author / Editor (optional)' : 'Autor / Redaktor (optional)'}</label>
                <input
                  className="nzz-text-input text-sm"
                  value={author}
                  onChange={(event) => setAuthor(event.target.value)}
                  placeholder={isEn ? 'e.g. Beat Gygi, Zurich' : 'z. B. Beat Gygi, Zürich'}
                />
              </div>
              <div className="nzz-field-group">
                <label className="nzz-field-label">{isEn ? 'Section / Desk (optional)' : 'Ressort (optional)'}</label>
                <input
                  className="nzz-text-input text-sm"
                  value={section}
                  onChange={(event) => setSection(event.target.value)}
                  placeholder={isEn ? 'Economy, International, Switzerland…' : 'Wirtschaft, International, Schweiz…'}
                />
              </div>
            </div>

            <div className="nzz-field-group">
              <label className="nzz-field-label">{isEn ? 'Article Body *' : 'Artikeltext *'}</label>
              <textarea
                className="nzz-textarea font-serif text-sm leading-relaxed"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={9}
                placeholder={isEn ? 'Write or paste full article body in markdown or text…' : 'Vollständigen Text hier einfügen oder schreiben…'}
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
                      <span>{isEn ? 'NZZ Style Guidelines passed (100% compliant)' : 'NZZ Stilrichtlinien bestanden (100% Konform)'}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={15} className="text-amber-700" />
                      <span>{isEn ? 'NZZ Editorial Recommendations:' : 'NZZ Stilempfehlungen:'}</span>
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
                  {isEn ? 'Cancel' : 'Abbrechen'}
                </button>
                <button
                  type="button"
                  className="nzz-btn-lint"
                  disabled={isLinting}
                  onClick={handleLintCheck}
                  title={isEn ? 'Lint text against NZZ rules' : 'NZZ Stilrichtlinien prüfen'}
                >
                  {isLinting ? (
                    <LoaderCircle className="spin" size={14} />
                  ) : (
                    <ShieldCheck size={14} className="text-red-600" />
                  )}
                  <span>{isEn ? 'Check NZZ Style' : 'NZZ-Stil prüfen'}</span>
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
                  <span>{isEn ? 'Save Draft' : 'Entwurf speichern'}</span>
                </button>

                <button
                  type="button"
                  className="nzz-btn-submit-red"
                  disabled={busy}
                  onClick={() => void submitCreate(true)}
                >
                  {busy ? <LoaderCircle className="spin" size={14} /> : <BarChart3 size={14} />}
                  <span>{isEn ? 'Save & Visualize' : 'Speichern & Visualisieren'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

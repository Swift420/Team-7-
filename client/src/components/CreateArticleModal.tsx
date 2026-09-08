import React, { useState } from 'react';
import { X, Sparkles, FileEdit, Image as ImageIcon, Tag, Clock, BookOpen, Check } from 'lucide-react';
import { useArticles } from '../context/ArticleContext';
import { useAuth } from '../context/AuthContext';
import { PRESET_IMAGE_OPTIONS } from '../data/mockArticles';
import { ArticleStatus } from '../types';

interface CreateArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateArticleModal: React.FC<CreateArticleModalProps> = ({ isOpen, onClose }) => {
  const { createArticle, updateArticle, editingArticle, setEditingArticle } = useArticles();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState(() => editingArticle?.title || '');
  const [subtitle, setSubtitle] = useState(() => editingArticle?.subtitle || '');
  const [category, setCategory] = useState(() => editingArticle?.category || 'Data & Tech');
  const [excerpt, setExcerpt] = useState(() => editingArticle?.excerpt || '');
  const [content, setContent] = useState(() => editingArticle?.content || '');
  const [coverImage, setCoverImage] = useState(() => editingArticle?.coverImage || PRESET_IMAGE_OPTIONS[0].url);
  const [tagsInput, setTagsInput] = useState(() => editingArticle?.tags.join(', ') || 'Data Viz, Analytics');
  const [readTimeMinutes, setReadTimeMinutes] = useState(() => editingArticle?.readTimeMinutes || 5);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  if (!isOpen) return null;

  const handleSave = (status: ArticleStatus) => {
    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }
    if (!excerpt.trim()) {
      setError('Short excerpt is required.');
      return;
    }
    if (!content.trim()) {
      setError('Article content is required.');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingArticle) {
      updateArticle(editingArticle.id, {
        title,
        subtitle: subtitle || undefined,
        category,
        excerpt,
        content,
        coverImage,
        tags: tagsArray,
        readTimeMinutes: Number(readTimeMinutes) || 5,
        status,
      });
      setEditingArticle(null);
    } else {
      createArticle(
        {
          title,
          subtitle: subtitle || undefined,
          category,
          excerpt,
          content,
          coverImage,
          tags: tagsArray,
          readTimeMinutes: Number(readTimeMinutes) || 5,
        },
        status
      );
    }

    onClose();
  };

  const handleTagSuggestion = (tag: string) => {
    const current = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!current.includes(tag)) {
      setTagsInput([...current, tag].join(', '));
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge editor">
              <FileEdit size={20} className="icon-purple" />
            </div>
            <div>
              <h2 className="modal-title">
                {editingArticle ? 'Edit Article' : 'Create & Publish New Article'}
              </h2>
              <p className="modal-subtitle">
                Publishing as <strong>{currentUser.name}</strong> ({currentUser.title})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {/* Editor tabs */}
        <div className="editor-subnav">
          <button
            type="button"
            className={`subnav-tab ${!previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(false)}
          >
            <FileEdit size={14} /> Write Content
          </button>
          <button
            type="button"
            className={`subnav-tab ${previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(true)}
          >
            <BookOpen size={14} /> Reader Preview
          </button>
        </div>

        <div className="editor-scroll-body">
          {!previewMode ? (
            <div className="editor-form-grid">
              {/* Row 1: Title & Subtitle */}
              <div className="form-group">
                <label>Article Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Next-Gen Real-Time Visual Systems in React 19"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subtitle / Strapline (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Architectural trade-offs, streaming benchmarks, and performance metrics"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Row 2: Category & Reading Time */}
              <div className="form-row-two">
                <div className="form-group">
                  <label>Section / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Data & Tech">Data & Tech</option>
                    <option value="AI & Machine Learning">AI & Machine Learning</option>
                    <option value="Design & UX">Design & UX</option>
                    <option value="Editorial Insights">Editorial Insights</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <Clock size={14} /> Estimated Read Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={readTimeMinutes}
                    onChange={(e) => setReadTimeMinutes(parseInt(e.target.value) || 1)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="form-group">
                <label>Summary / Excerpt (Displayed in Article Feeds) *</label>
                <textarea
                  rows={2}
                  placeholder="Brief 1-2 sentence hook summarizing the key takeaways for readers..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="form-textarea"
                  required
                />
              </div>

              {/* Cover Image Preset Picker & Custom Input */}
              <div className="form-group">
                <label>
                  <ImageIcon size={14} /> Cover Image
                </label>
                <div className="preset-images-strip">
                  {PRESET_IMAGE_OPTIONS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className={`preset-thumb-btn ${coverImage === preset.url ? 'active' : ''}`}
                      onClick={() => setCoverImage(preset.url)}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} />
                      <span>{preset.label}</span>
                      {coverImage === preset.url && <Check size={14} className="check-icon" />}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or enter custom image URL (https://...)"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="form-input"
                  style={{ marginTop: '0.5rem' }}
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label>
                  <Tag size={14} /> Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Data Viz, Architecture"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="form-input"
                />
                <div className="tag-suggestions">
                  <span className="suggestion-label">Suggested:</span>
                  {['React', 'Vite', 'Data Viz', 'AI Agents', 'UI/UX', 'Node.js', 'Case Study'].map(
                    (sugg) => (
                      <button
                        type="button"
                        key={sugg}
                        className="suggestion-chip"
                        onClick={() => handleTagSuggestion(sugg)}
                      >
                        +{sugg}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Full Content */}
              <div className="form-group">
                <div className="label-with-helper">
                  <label>Full Article Content (Markdown / Formatted text) *</label>
                  <span className="helper-text">Supports markdown headers (##), quotes (&gt;), and bullet points</span>
                </div>
                <textarea
                  rows={9}
                  placeholder={`## Introduction\nStart writing your article here...\n\n### Core Insights\n- Key point one\n- Key point two\n\n> Quote or conclusion.`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="form-textarea code-font"
                  required
                />
              </div>
            </div>
          ) : (
            /* Live Preview Screen */
            <div className="article-preview-pane">
              <div className="preview-hero">
                <img src={coverImage} alt={title || 'Preview'} className="preview-cover-img" />
                <div className="preview-overlay">
                  <span className="category-tag">{category}</span>
                  <h1 className="preview-title">{title || 'Untitled Article'}</h1>
                  {subtitle && <p className="preview-subtitle">{subtitle}</p>}
                </div>
              </div>

              <div className="preview-meta-row">
                <div className="preview-author">
                  <img src={currentUser.avatar} alt={currentUser.name} className="author-avatar" />
                  <div>
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.title}</span>
                  </div>
                </div>
                <div className="preview-stats">
                  <span>{readTimeMinutes} min read</span>
                  <span>•</span>
                  <span>Draft Preview</span>
                </div>
              </div>

              <div className="preview-excerpt-box">
                <em>{excerpt || 'No excerpt provided yet.'}</em>
              </div>

              <div className="preview-article-body">
                {content ? (
                  content.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('## ')) {
                      return <h2 key={idx}>{paragraph.replace('## ', '')}</h2>;
                    }
                    if (paragraph.startsWith('### ')) {
                      return <h3 key={idx}>{paragraph.replace('### ', '')}</h3>;
                    }
                    if (paragraph.startsWith('> ')) {
                      return <blockquote key={idx}>{paragraph.replace('> ', '')}</blockquote>;
                    }
                    return <p key={idx}>{paragraph}</p>;
                  })
                ) : (
                  <p className="text-muted">Content will appear here as you write.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Publishing Actions */}
        <div className="modal-footer">
          <div className="footer-left">
            <span className="role-status-note">
              Editor Mode: <strong>{currentUser.name}</strong>
            </span>
          </div>
          <div className="footer-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-draft"
              onClick={() => handleSave('draft')}
              title="Save to drafts (visible only to editors)"
            >
              <FileEdit size={16} /> Save as Draft
            </button>
            <button
              type="button"
              className="btn-publish-primary"
              onClick={() => handleSave('published')}
              title="Publish immediately to all readers"
            >
              <Sparkles size={16} />
              <span>{editingArticle?.status === 'published' ? 'Update & Keep Published' : 'Publish Article'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

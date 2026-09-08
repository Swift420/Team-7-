import React from 'react';
import { ShieldAlert, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';

interface AccessControlNoticeProps {
  title?: string;
  description?: string;
}

export const AccessControlNotice: React.FC<AccessControlNoticeProps> = ({
  title = 'Editor Access Required',
  description = 'The Editor Desk and Drafts section contains unpublished articles, editorial revision queues, and publishing tools reserved for Editors.',
}) => {
  const { dummyEditors, loginAsDummy } = useAuth();
  const { setIsAuthModalOpen } = useArticles();

  return (
    <div className="access-notice-card">
      <div className="access-notice-icon-box">
        <Lock size={32} className="icon-amber" />
      </div>

      <div className="access-notice-content">
        <div className="access-badge-row">
          <span className="role-pill role-pill-viewer">Current Role: VIEWER</span>
          <span className="notice-lock-pill">
            <ShieldAlert size={12} /> Restricted Section
          </span>
        </div>

        <h3 className="access-title">{title}</h3>
        <p className="access-desc">{description}</p>

        <div className="role-comparison-grid">
          <div className="role-box viewer-box">
            <div className="role-box-header">
              <span className="role-tag">Viewer (Current)</span>
            </div>
            <ul>
              <li>✓ Read published articles across all public sections</li>
              <li>✓ View real-time analytics reports</li>
              <li>✗ Cannot access unpublished drafts</li>
              <li>✗ Cannot create or publish articles</li>
            </ul>
          </div>

          <div className="role-box editor-box">
            <div className="role-box-header">
              <span className="role-tag editor">Editor (Special Permissions)</span>
            </div>
            <ul>
              <li>✓ "+ Create Article" button at top of page</li>
              <li>✓ Write, save drafts & publish immediately</li>
              <li>✓ Edit & delete existing stories</li>
              <li>✓ Access full Editor Desk & Draft workspace</li>
            </ul>
          </div>
        </div>

        <div className="access-cta-row">
          <button
            className="btn-switch-primary"
            onClick={() => {
              loginAsDummy(dummyEditors[0].id);
            }}
          >
            <Sparkles size={16} />
            <span>Switch to Dummy Editor ({dummyEditors[0].name})</span>
            <ArrowRight size={16} />
          </button>

          <button
            className="btn-view-all-accounts"
            onClick={() => setIsAuthModalOpen(true)}
          >
            View All Dummy Accounts
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Shield, UserCheck, Sparkles, Plus, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';

export const RoleContextBanner: React.FC = () => {
  const { currentUser, isEditor, switchRole } = useAuth();
  const { setIsCreateModalOpen, setIsAuthModalOpen } = useArticles();

  return (
    <div className={`role-context-banner ${isEditor ? 'is-editor' : 'is-viewer'}`}>
      <div className="banner-left">
        <div className="role-avatar-wrap">
          <img src={currentUser.avatar} alt={currentUser.name} className="banner-user-avatar" />
          <div className="role-icon-corner">
            {isEditor ? <Shield size={12} /> : <UserCheck size={12} />}
          </div>
        </div>

        <div className="banner-text">
          <div className="banner-headline">
            <span className="user-name-strong">{currentUser.name}</span>
            <span className={`role-pill role-pill-${currentUser.role}`}>
              {currentUser.role.toUpperCase()}
            </span>
            <span className="bullet-sep">•</span>
            <span className="user-title-text">{currentUser.title}</span>
          </div>
          <p className="banner-description">
            {isEditor
              ? 'Editor permissions active: You can import NZZ JSON or Markdown articles and remove imported records.'
              : 'Viewer mode active: Read-only access to the PostgreSQL-backed article library. Switch to an Editor account to test article import.'}
          </p>
        </div>
      </div>

      <div className="banner-right">
        {/* Quick action buttons */}
        {isEditor ? (
          <>
            <button
              className="banner-btn-create"
              onClick={() => setIsCreateModalOpen(true)}
              title="Import an article"
            >
              <Plus size={15} />
              <span>Import Article</span>
            </button>
            <button
              className="banner-btn-switch"
              onClick={switchRole}
              title="Switch to Viewer mode to test viewer experience"
            >
              <span>Test as Viewer</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="banner-btn-switch-editor"
              onClick={switchRole}
              title="Switch to Editor mode to test article import"
            >
              <Sparkles size={14} />
              <span>Switch to Editor Mode</span>
            </button>
            <button
              className="banner-btn-accounts"
              onClick={() => setIsAuthModalOpen(true)}
              title="View all dummy accounts"
            >
              <Users size={14} />
              <span>Dummy Accounts</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

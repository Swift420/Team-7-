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
              ? 'Special permissions active: You can create new articles, publish them live to readers, manage drafts, and access the Editor Desk.'
              : 'Viewer mode active: Read-only access to published articles and public sections. Switch to a Dummy Editor account to test article creation & publishing.'}
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
              title="Create a new article"
            >
              <Plus size={15} />
              <span>+ Create & Publish Article</span>
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
              title="Switch to Editor mode to test creating & publishing"
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

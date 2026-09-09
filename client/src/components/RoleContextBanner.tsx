import React from 'react';
import { Shield, UserCheck, Sparkles, Plus, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useArticles } from '../hooks/useArticles';
import { useLanguage } from '../hooks/useLanguage';

export const RoleContextBanner: React.FC = () => {
  const { currentUser, isEditor, switchRole } = useAuth();
  const { openCreateArticle, setIsAuthModalOpen } = useArticles();
  const { t } = useLanguage();

  if (!isEditor) return null;

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
              {currentUser.role === 'editor' ? t('nav.editor').toUpperCase() : t('nav.reader').toUpperCase()}
            </span>
            <span className="bullet-sep">•</span>
            <span className="user-title-text">{currentUser.title}</span>
          </div>
          <p className="banner-description">
            {isEditor
              ? t('role.banner_editor_desc')
              : t('role.banner_viewer_desc')}
          </p>
        </div>
      </div>

      <div className="banner-right">
        {/* Quick action buttons */}
        {isEditor ? (
          <>
            <button
              className="banner-btn-secondary"
              onClick={() => openCreateArticle('import')}
              title={t('role.import_btn')}
            >
              <Plus size={14} />
              <span>{t('role.import_btn')}</span>
            </button>
            <button
              className="banner-btn-create"
              onClick={() => openCreateArticle('create')}
              title={t('role.create_btn')}
            >
              <Plus size={14} />
              <span>{t('role.create_btn')}</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="banner-btn-switch-editor"
              onClick={switchRole}
              title={t('role.switch_editor')}
            >
              <Sparkles size={14} />
              <span>{t('role.switch_editor')}</span>
            </button>
            <button
              className="banner-btn-accounts"
              onClick={() => setIsAuthModalOpen(true)}
              title={t('role.dummy_accounts')}
            >
              <Users size={14} />
              <span>{t('role.dummy_accounts')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

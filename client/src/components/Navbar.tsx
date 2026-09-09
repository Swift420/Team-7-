import React from 'react';
import {
  FilePenLine,
  FileUp,
  Globe2,
  LogOut,
  Menu,
  Search,
  Shield,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';
import { useLanguage } from '../context/LanguageContext';
import { sectionsMatch } from '../utils/sectionTranslation';
import { NzzLogo } from './common/NzzLogo';

export const Navbar: React.FC = () => {
  const { currentUser, isEditor, logout } = useAuth();
  const {
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
    openCreateArticle,
    setIsAuthModalOpen,
    closeArticle,
    searchQuery,
    articles,
    isGlobeOpen,
    toggleGlobe,
  } = useArticles();
  const { language, setLanguage, t, formatSection, formatDate } = useLanguage();

  // Curate unique broadsheet sections based on loaded articles + standard core departments
  const rawSections = [
    'International',
    'Economy',
    'Switzerland',
    'Culture',
    'Sports',
    'Opinion',
    'Technology',
    'Science',
  ];

  // Include any extra unique sections from article corpus
  articles.forEach((a) => {
    if (a.section) {
      const formatted = formatSection(a.section);
      if (formatted && !rawSections.some((s) => sectionsMatch(s, formatted))) {
        rawSections.push(a.section);
      }
    }
  });

  const handleImport = () => (isEditor ? openCreateArticle('import') : setIsAuthModalOpen(true));
  const handleCreate = () => (isEditor ? openCreateArticle('create') : setIsAuthModalOpen(true));
  const goHome = () => {
    closeArticle();
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const currentDate = formatDate(new Date().toISOString(), 'weekday');

  return (
    <header className="nzz-site-header">
      {/* 1. Top Utility Strip */}
      <div className="nzz-utility-bar">
        <div className="nzz-header-container nzz-utility-inner">
          <div className="nzz-utility-left">
            <span className="nzz-edition-pill">
              <span className="nzz-edition-dot" /> {t('nav.edition')}
            </span>
            <span className="nzz-utility-sep">·</span>
            <span className="nzz-utility-link">{t('nav.epaper')}</span>
            <span className="nzz-utility-link">{t('nav.jobs')}</span>
            <span className="nzz-utility-link">{t('nav.newsletter')}</span>
            <span className="nzz-utility-link">{t('nav.academy')}</span>
          </div>

          <div className="nzz-utility-right">
            <span className="nzz-date-display">{currentDate}</span>
            <span className="nzz-utility-sep">·</span>

            {/* Bilingual Switcher Toggle (EN | DE) */}
            <div className="nzz-lang-switcher" role="group" aria-label={t('nav.switch_language')}>
              <button
                type="button"
                className={`nzz-lang-btn ${language === 'en' ? 'is-active' : ''}`}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                title="Switch to English (Priority)"
              >
                EN
              </button>
              <span className="nzz-lang-divider">|</span>
              <button
                type="button"
                className={`nzz-lang-btn ${language === 'de' ? 'is-active' : ''}`}
                onClick={() => setLanguage('de')}
                aria-pressed={language === 'de'}
                title="Auf Deutsch umschalten"
              >
                DE
              </button>
            </div>

            <span className="nzz-utility-sep">·</span>
            {isEditor ? (
              <span className="nzz-role-status editor">
                <Shield size={12} /> {t('nav.editor')}: {currentUser.name}
              </span>
            ) : (
              <span className="nzz-role-status reader">
                <span className="nzz-live-indicator-dot" /> {t('nav.editorial_status')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Masthead (Authentic NZZ Centered Gothic Logo) */}
      <div className="nzz-masthead-bar">
        <div className="nzz-header-container nzz-masthead-inner">
          {/* Left: Menu & Search */}
          <div className="nzz-masthead-left">
            <button className="nzz-btn-menu" aria-label={t('nav.menu')} onClick={goHome}>
              <Menu size={18} />
              <span className="nzz-menu-label">{t('nav.menu')}</span>
            </button>

            <div className="nzz-search-container">
              <Search size={15} className="nzz-search-icon" />
              <input
                type="text"
                placeholder={t('nav.search_placeholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="nzz-search-field"
                aria-label={t('nav.search_label')}
              />
              {searchQuery && (
                <button
                  className="nzz-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('nav.search_clear')}
                  title={t('nav.search_clear')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Center: Official NZZ Serif Logo & Tagline */}
          <div
            className="nzz-masthead-center"
            onClick={goHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') goHome();
            }}
          >
            <NzzLogo color="black" width={138} className="nzz-main-logo" />
            <div className="nzz-masthead-tagline">Neue Zürcher Zeitung · Seit 1780</div>
          </div>

          {/* Right: Globus Toggle + Editor Actions + Sign In */}
          <div className="nzz-masthead-right">
            {/* Split Screen 3D Globe Dock Button */}
            <button
              className={`nzz-btn-globus ${isGlobeOpen ? 'active' : ''}`}
              onClick={toggleGlobe}
              title={t('nav.globe_title')}
            >
              <Globe2 size={16} className={isGlobeOpen ? 'text-red-600 animate-spin-slow' : ''} />
              <span className="nzz-globus-text">{t('nav.globe')}</span>
              <span className="nzz-globus-indicator">
                {isGlobeOpen ? (language === 'de' ? 'Aktiv' : 'Active') : '3D'}
              </span>
            </button>

            {/* Editor Action Buttons */}
            {isEditor && (
              <>
                <button
                  className="nzz-btn-action outline"
                  onClick={handleImport}
                  title={t('nav.import_article')}
                >
                  <FileUp size={15} />
                  <span>{t('nav.import_article')}</span>
                </button>
                <button
                  className="nzz-btn-action dark"
                  onClick={handleCreate}
                  title={t('nav.create_article')}
                >
                  <FilePenLine size={15} />
                  <span>{t('nav.create_article')}</span>
                </button>
              </>
            )}

            {/* User Account / Sign In */}
            {isEditor ? (
              <div className="nzz-user-dropdown-wrap">
                <button
                  className="nzz-user-profile-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  title={t('nav.editor')}
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="nzz-user-avatar"
                  />
                  <div className="nzz-user-name-box">
                    <span className="nzz-user-name">{currentUser.name.split(' ')[0]}</span>
                    <span className="nzz-user-role-badge">{t('nav.editor')}</span>
                  </div>
                </button>
                <button
                  className="nzz-btn-logout"
                  onClick={logout}
                  title={t('nav.sign_out')}
                  aria-label={t('nav.sign_out')}
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                className="nzz-btn-login"
                onClick={() => setIsAuthModalOpen(true)}
                title={t('nav.sign_in')}
              >
                <UserRound size={16} />
                <span>{t('nav.sign_in')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Section Navigation Bar (Sticky with Authentic 2px Red Underline) */}
      <nav className="nzz-section-navbar">
        <div className="nzz-header-container nzz-section-nav-inner">
          <div className="nzz-tabs-list">
            <button
              className={`nzz-tab-link ${selectedCategory === 'all' || selectedCategory === 'All' || selectedCategory === 'Alle' ? 'active' : ''}`}
              onClick={() => {
                closeArticle();
                setSelectedCategory('all');
              }}
            >
              {t('section.all')}
            </button>
            {rawSections.map((sec) => {
              const label = formatSection(sec);
              const isActive =
                selectedCategory !== 'all' &&
                selectedCategory !== 'All' &&
                selectedCategory !== 'Alle' &&
                sectionsMatch(selectedCategory, sec);

              return (
                <button
                  key={sec}
                  className={`nzz-tab-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    closeArticle();
                    setSelectedCategory(sec);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="nzz-nav-right-hint">
            <span className="nzz-pro-indicator">
              <span className="nzz-pro-badge">PRO</span> Liquid Journalism
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
};

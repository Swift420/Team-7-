import React from 'react';
import {
  BookOpen,
  Plus,
  Shield,
  UserCheck,
  Lock,
  ChevronDown,
  Sparkles,
  BarChart3,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';
import { ARTICLE_CATEGORIES } from '../data/mockArticles';

export const Navbar: React.FC = () => {
  const { currentUser, isEditor, switchRole } = useAuth();
  const {
    selectedCategory,
    setSelectedCategory,
    setIsCreateModalOpen,
    setIsAuthModalOpen,
    searchQuery,
    setSearchQuery,
    articles,
  } = useArticles();

  const handleCreateClick = () => {
    if (isEditor) {
      setIsCreateModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const draftCount = articles.filter((a) => a.status === 'draft').length;

  return (
    <header className="navbar-container">
      {/* Top Bar: Brand, Search, Top Create Button & User Switcher */}
      <div className="navbar-top">
        {/* Brand */}
        <div className="navbar-brand-group" onClick={() => setSelectedCategory('all')}>
          <div className="brand-logo-icon">
            <BookOpen size={22} />
          </div>
          <div className="brand-titles">
            <div className="brand-title-row">
              <span className="brand-name">CHRONICLE</span>
              <span className="brand-tag">INSIGHTS</span>
            </div>
            <span className="brand-sub">Visual Journalism & Engineering Publication</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="nav-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search articles by title, tags, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nav-search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Right Top Actions */}
        <div className="navbar-top-actions">
          {/* THE PROMINENT CREATE ARTICLE BUTTON AT THE TOP OF THE PAGE */}
          <button
            className={`btn-top-create ${isEditor ? 'editor-active' : 'viewer-prompt'}`}
            onClick={handleCreateClick}
            title={
              isEditor
                ? 'Create a new article and publish'
                : 'Click to switch to a dummy editor account to create articles'
            }
          >
            <Plus size={18} className="create-icon" />
            <span className="btn-create-label">
              {isEditor ? 'Create Article' : 'Create Article (Editor)'}
            </span>
            {!isEditor && <Lock size={12} className="create-lock-icon" />}
          </button>

          {/* Quick Role Toggle Button (1-Click switch between Editor & Viewer) */}
          <button
            className="btn-quick-role-toggle"
            onClick={switchRole}
            title={`Currently ${currentUser.role}. Click to quick-switch to ${
              isEditor ? 'Viewer' : 'Editor'
            }`}
          >
            <span className="toggle-label">Quick Switch:</span>
            <span className={`toggle-pill ${isEditor ? 'to-viewer' : 'to-editor'}`}>
              {isEditor ? 'Switch to Viewer' : 'Switch to Editor'}
            </span>
          </button>

          {/* User Profile & Dummy Accounts Switcher */}
          <div className="user-profile-menu-container">
            <button
              className="user-profile-btn"
              onClick={() => setIsAuthModalOpen(true)}
              title="Manage dummy accounts and permissions"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="user-avatar-top"
              />
              <div className="user-info-text">
                <span className="user-display-name">{currentUser.name}</span>
                <span className={`user-role-badge badge-${currentUser.role}`}>
                  {isEditor ? <Shield size={10} /> : <UserCheck size={10} />}
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
              <ChevronDown size={14} className="chevron-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar / Category & Section Tabs */}
      <nav className="navbar-sections-nav">
        <div className="nav-tabs-scroll">
          {ARTICLE_CATEGORIES.map((cat) => {
            const isDesk = cat.id === 'editor-desk';
            const isActive = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                className={`section-nav-tab ${isActive ? 'active' : ''} ${
                  isDesk ? 'desk-tab' : ''
                }`}
                onClick={() => setSelectedCategory(cat.slug)}
              >
                {isDesk ? (
                  <>
                    <Shield size={14} className="desk-icon" />
                    <span>{cat.name}</span>
                    {draftCount > 0 && (
                      <span className="drafts-count-chip" title={`${draftCount} Drafts in progress`}>
                        {draftCount}
                      </span>
                    )}
                    {!isEditor && <Lock size={11} className="tab-lock-icon" />}
                  </>
                ) : (
                  <span>{cat.name}</span>
                )}
              </button>
            );
          })}

          {/* Analytics Hub Section */}
          <button
            className={`section-nav-tab ${selectedCategory === 'analytics-hub' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('analytics-hub')}
          >
            <BarChart3 size={14} />
            <span>Analytics Hub</span>
          </button>
        </div>

        {/* Role permission info banner on the right */}
        <div className="nav-role-tip">
          {isEditor ? (
            <span className="role-tip-editor">
              <Sparkles size={13} /> Editor active: You can create, edit, & publish articles
            </span>
          ) : (
            <span className="role-tip-viewer">
              <Lock size={13} /> Viewer mode: Read-only access to published content
            </span>
          )}
        </div>
      </nav>
    </header>
  );
};

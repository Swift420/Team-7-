import React from 'react';
import { BookOpen, ChevronDown, FilePenLine, FileUp, Lock, Search, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';

export const Navbar: React.FC = () => {
  const { currentUser, isEditor, switchRole } = useAuth();
  const { selectedCategory, setSelectedCategory, setSearchQuery, openCreateArticle, setIsAuthModalOpen, closeArticle, searchQuery, articles } = useArticles();
  const sections = [...new Set(articles.map((article) => article.section).filter((value): value is string => Boolean(value)))].sort();

  const handleImport = () => isEditor ? openCreateArticle('import') : setIsAuthModalOpen(true);
  const handleCreate = () => isEditor ? openCreateArticle('create') : setIsAuthModalOpen(true);
  const goHome = () => { closeArticle(); setSelectedCategory('all'); setSearchQuery(''); };

  return <header className="navbar-container">
    <div className="navbar-top">
      <div className="navbar-brand-group" onClick={goHome} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') goHome(); }}>
        <div className="brand-logo-icon"><BookOpen size={22} /></div>
        <div className="brand-titles"><div className="brand-title-row"><span className="brand-name">CHRONICLE</span><span className="brand-tag">INSIGHTS</span></div><span className="brand-sub">Visual Velocity Article Library</span></div>
      </div>
      <div className="nav-search-wrapper">
        <Search size={16} className="search-icon" />
        <input type="text" placeholder="Search headline, section, author, or tag…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="nav-search-input" />
        {searchQuery && <button className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>}
      </div>
      <div className="navbar-top-actions">
        <button className={`btn-top-create ${isEditor ? 'editor-active' : 'viewer-prompt'}`} onClick={handleImport}>
          <FileUp size={18} /><span className="btn-create-label">Import Article</span>{!isEditor && <Lock size={12} />}
        </button>
        <button className={`btn-top-create ${isEditor ? 'editor-active' : 'viewer-prompt'}`} onClick={handleCreate}>
          <FilePenLine size={18} /><span className="btn-create-label">Create Article</span>{!isEditor && <Lock size={12} />}
        </button>
        <button className="btn-quick-role-toggle" onClick={switchRole}><span className="toggle-label">Quick Switch:</span><span className={`toggle-pill ${isEditor ? 'to-viewer' : 'to-editor'}`}>{isEditor ? 'Switch to Viewer' : 'Switch to Editor'}</span></button>
        <div className="user-profile-menu-container"><button className="user-profile-btn" onClick={() => setIsAuthModalOpen(true)}><img src={currentUser.avatar} alt="" className="user-avatar-top" /><div className="user-info-text"><span className="user-display-name">{currentUser.name}</span><span className={`user-role-badge badge-${currentUser.role}`}>{isEditor ? <Shield size={10} /> : <UserCheck size={10} />}{currentUser.role.toUpperCase()}</span></div><ChevronDown size={14} /></button></div>
      </div>
    </div>
    <nav className="navbar-sections-nav">
      <div className="nav-tabs-scroll">
        <button className={`section-nav-tab ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => { closeArticle(); setSelectedCategory('all'); }}>All Articles</button>
        {sections.map((section) => <button key={section} className={`section-nav-tab ${selectedCategory === section ? 'active' : ''}`} onClick={() => { closeArticle(); setSelectedCategory(section); }}>{section}</button>)}
      </div>
      <div className="nav-role-tip">{isEditor ? <span className="role-tip-editor"><Shield size={13} /> Editor: imports and deletion enabled</span> : <span className="role-tip-viewer"><Lock size={13} /> Viewer: read-only article access</span>}</div>
    </nav>
  </header>;
};

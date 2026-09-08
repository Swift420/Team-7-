import React, { useState } from 'react';
import { X, Shield, User, Check, LogIn, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DummyAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DummyAccountsModal: React.FC<DummyAccountsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, dummyEditors, dummyViewers, loginAsDummy, login } = useAuth();
  const [tab, setTab] = useState<'quick' | 'manual'>('quick');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const success = login(emailInput, passwordInput);
    if (success) {
      onClose();
    } else {
      setErrorMessage('Invalid credentials. Check the dummy accounts list for valid logins.');
    }
  };

  const handleQuickSelect = (userId: string) => {
    loginAsDummy(userId);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Shield size={20} className="icon-blue" />
            </div>
            <div>
              <h2 className="modal-title">User Accounts & Roles</h2>
              <p className="modal-subtitle">
                Switch between demo Editor accounts (import/delete permissions) and Viewer accounts
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="active-user-strip">
          <div className="active-user-info">
            <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar-sm" />
            <div>
              <div className="active-user-name">
                {currentUser.name}
                <span className={`role-pill role-pill-${currentUser.role}`}>
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
              <div className="active-user-sub">{currentUser.title} • {currentUser.email}</div>
            </div>
          </div>
          <div className="active-user-perm-note">
            {currentUser.role === 'editor' ? (
              <span className="text-editor-ok">
                <Sparkles size={14} /> Editor permissions: Import and delete articles
              </span>
            ) : (
              <span className="text-viewer-note">
                <Lock size={14} /> Read-only viewer: View articles & public sections
              </span>
            )}
          </div>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${tab === 'quick' ? 'active' : ''}`}
            onClick={() => setTab('quick')}
          >
            One-Click Dummy Accounts
          </button>
          <button
            className={`auth-tab-btn ${tab === 'manual' ? 'active' : ''}`}
            onClick={() => setTab('manual')}
          >
            Manual Login Form
          </button>
        </div>

        {tab === 'quick' ? (
          <div className="accounts-list-container">
            {/* Editors Section */}
            <div className="role-group-header">
              <div className="role-group-title">
                <Shield size={16} className="icon-purple" />
                <span>Dummy Editor Accounts</span>
                <span className="role-count-badge">Special Permissions</span>
              </div>
              <p className="role-group-desc">
                Can import supported NZZ JSON and Markdown articles and remove imported records.
              </p>
            </div>

            <div className="accounts-grid">
              {dummyEditors.map((editor) => {
                const isActive = currentUser.id === editor.id;
                return (
                  <div
                    key={editor.id}
                    className={`account-card ${isActive ? 'selected' : ''}`}
                    onClick={() => handleQuickSelect(editor.id)}
                  >
                    <div className="account-card-top">
                      <img src={editor.avatar} alt={editor.name} className="account-avatar" />
                      <div className="account-details">
                        <div className="account-name-row">
                          <span className="account-name">{editor.name}</span>
                          <span className="role-pill role-pill-editor">EDITOR</span>
                        </div>
                        <span className="account-title">{editor.title}</span>
                      </div>
                      {isActive ? (
                        <div className="active-checkmark" title="Currently Active">
                          <Check size={16} />
                        </div>
                      ) : (
                        <button className="select-account-btn">Switch</button>
                      )}
                    </div>
                    <p className="account-bio">{editor.bio}</p>
                    <div className="account-creds">
                      <code>{editor.email}</code>
                      <span className="cred-pass">pwd: {editor.password}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Viewers Section */}
            <div className="role-group-header" style={{ marginTop: '1.25rem' }}>
              <div className="role-group-title">
                <User size={16} className="icon-blue" />
                <span>Dummy Viewer Accounts</span>
                <span className="role-count-badge viewer">Standard Reader</span>
              </div>
              <p className="role-group-desc">
                Read-only access to imported articles. Cannot import or delete records.
              </p>
            </div>

            <div className="accounts-grid">
              {dummyViewers.map((viewer) => {
                const isActive = currentUser.id === viewer.id;
                return (
                  <div
                    key={viewer.id}
                    className={`account-card ${isActive ? 'selected' : ''}`}
                    onClick={() => handleQuickSelect(viewer.id)}
                  >
                    <div className="account-card-top">
                      <img src={viewer.avatar} alt={viewer.name} className="account-avatar" />
                      <div className="account-details">
                        <div className="account-name-row">
                          <span className="account-name">{viewer.name}</span>
                          <span className="role-pill role-pill-viewer">VIEWER</span>
                        </div>
                        <span className="account-title">{viewer.title}</span>
                      </div>
                      {isActive ? (
                        <div className="active-checkmark" title="Currently Active">
                          <Check size={16} />
                        </div>
                      ) : (
                        <button className="select-account-btn">Switch</button>
                      )}
                    </div>
                    <p className="account-bio">{viewer.bio}</p>
                    <div className="account-creds">
                      <code>{viewer.email}</code>
                      <span className="cred-pass">pwd: {viewer.password}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form className="manual-login-form" onSubmit={handleManualLogin}>
            {errorMessage && <div className="form-error-banner">{errorMessage}</div>}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="e.g. sarah.editor@journal.io"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password (e.g. editor123)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="quick-fill-hints">
              <span className="hint-label">Quick autofill:</span>
              <button
                type="button"
                className="hint-btn"
                onClick={() => {
                  setEmailInput('sarah.editor@journal.io');
                  setPasswordInput('editor123');
                }}
              >
                Sarah (Editor)
              </button>
              <button
                type="button"
                className="hint-btn"
                onClick={() => {
                  setEmailInput('marcus.writer@journal.io');
                  setPasswordInput('editor123');
                }}
              >
                Marcus (Editor)
              </button>
              <button
                type="button"
                className="hint-btn"
                onClick={() => {
                  setEmailInput('alex.viewer@reader.io');
                  setPasswordInput('viewer123');
                }}
              >
                Alex (Viewer)
              </button>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <LogIn size={16} /> Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

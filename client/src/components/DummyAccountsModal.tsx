import React, { useState } from 'react';
import { LogIn, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface DemoEditor {
  username: string;
  name: string;
  title: string;
  avatar: string;
  badge: string;
}

const DEMO_EDITORS: DemoEditor[] = [
  {
    username: 'teofilus',
    name: 'Teofilus Shaduka',
    title: 'Lead Editor & Multimodal Architect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    badge: 'Lead Architect',
  },
  {
    username: 'sarah',
    name: 'Sarah Jenkins',
    title: 'Lead Editor, Tech & Data',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    badge: 'Editorial Lead',
  },
  {
    username: 'marcus',
    name: 'Marcus Vance',
    title: 'Senior Investigative Editor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    badge: 'Investigative',
  },
  {
    username: 'elena',
    name: 'Elena Rostova',
    title: 'Visual Journalism & AI Editor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    badge: 'Visuals & AI',
  },
];

export const DummyAccountsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('teofilus');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleQuickLogin = async (editorUsername: string) => {
    setUsername(editorUsername);
    setPassword('editor123');
    setBusy(true);
    setError('');
    const ok = await login(editorUsername, 'editor123');
    if (ok) {
      onClose();
    } else {
      setError('Invalid editor username or password.');
    }
    setBusy(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    if (await login(username, password)) {
      onClose();
    } else {
      setError('Invalid editor username or password.');
    }
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window nzz-auth-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="nzz-dialog-header">
          <div className="nzz-dialog-title-wrap">
            <span className="nzz-dialog-kicker">
              <Shield size={13} /> {t('auth.kicker')}
            </span>
            <h2 className="nzz-dialog-headline">{t('auth.headline')}</h2>
            <p className="nzz-dialog-sub">
              {t('auth.sub')}
            </p>
          </div>
          <button className="nzz-dialog-close" onClick={onClose} aria-label={t('auth.cancel')}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="nzz-dialog-error">{error}</div>}

        {/* Quick Select Editor Account */}
        <div className="nzz-quick-profiles">
          <label className="nzz-field-label">
            {t('auth.profile_label')}
          </label>
          <div className="nzz-profiles-grid">
            {DEMO_EDITORS.map((editor) => (
              <button
                key={editor.username}
                type="button"
                className={`nzz-profile-card ${
                  username.toLowerCase() === editor.username.toLowerCase() ? 'active' : ''
                }`}
                onClick={() => void handleQuickLogin(editor.username)}
                disabled={busy}
              >
                <img
                  src={editor.avatar}
                  alt={editor.name}
                  className="nzz-profile-avatar"
                />
                <div className="nzz-profile-info">
                  <div className="nzz-profile-topline">
                    <span className="nzz-profile-name">{editor.name}</span>
                    <span className="nzz-profile-badge">{editor.badge}</span>
                  </div>
                  <div className="nzz-profile-title">{editor.title}</div>
                  <div className="nzz-profile-user">@{editor.username}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Credentials Form */}
        <form className="nzz-login-form" onSubmit={(event) => void submit(event)}>
          <div className="nzz-field-group">
            <label className="nzz-field-label">{t('auth.username')}</label>
            <input
              className="nzz-text-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t('auth.username_placeholder')}
              required
            />
          </div>
          <div className="nzz-field-group">
            <label className="nzz-field-label">{t('auth.password')}</label>
            <input
              className="nzz-text-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('auth.password_placeholder')}
              required
            />
          </div>

          <div className="nzz-dialog-actions">
            <button type="button" className="nzz-btn-cancel" onClick={onClose}>
              {t('auth.cancel')}
            </button>
            <button type="submit" className="nzz-btn-submit-red" disabled={busy}>
              <LogIn size={15} />
              <span>{busy ? t('auth.logging_in') : t('auth.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

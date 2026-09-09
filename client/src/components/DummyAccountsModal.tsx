import React, { useState } from 'react';
import { LogIn, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      <div className="modal-window auth-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="modal-title">Editor Sign In</h2>
              <p className="modal-subtitle">
                Sign in to create, draft, lint NZZ guidelines, and publish multimodal stories.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        {/* Quick Select Editor Account */}
        <div className="my-3">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            Select an Editor Profile:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_EDITORS.map((editor) => (
              <button
                key={editor.username}
                type="button"
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                  username.toLowerCase() === editor.username.toLowerCase()
                    ? 'bg-red-950/40 border-red-500 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
                onClick={() => void handleQuickLogin(editor.username)}
                disabled={busy}
              >
                <img
                  src={editor.avatar}
                  alt={editor.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{editor.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
                      {editor.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{editor.title}</div>
                  <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                    User: {editor.username}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Credentials Form */}
        <form className="manual-login-form mt-4 pt-3 border-t border-slate-800" onSubmit={(event) => void submit(event)}>
          <div className="form-group">
            <label>Username</label>
            <input
              className="form-input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Editor username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <div className="form-actions mt-3">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign In as Editor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

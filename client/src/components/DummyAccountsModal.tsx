import React, { useState } from 'react';
import { LogIn, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DummyAccountsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    if (await login(username, password)) { onClose(); } else setError('Invalid editor username or password.');
    setBusy(false);
  };
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-window auth-modal" onClick={(event) => event.stopPropagation()}>
    <div className="modal-header"><div className="modal-title-wrap"><div className="modal-icon-badge"><Shield size={20} /></div><div><h2 className="modal-title">Editor sign in</h2><p className="modal-subtitle">Readers can browse anonymously. Sign in to edit, import, or visualize articles.</p></div></div><button className="modal-close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
    <form className="manual-login-form" onSubmit={(event) => void submit(event)}>{error && <div className="form-error-banner">{error}</div>}<div className="form-group"><label>Username</label><input className="form-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Editor username" autoFocus required /></div><div className="form-group"><label>Password</label><input className="form-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required /></div><p className="helper-text">Editor accounts are managed by the application database.</p><div className="form-actions"><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}><LogIn size={16} /> {busy ? 'Signing in…' : 'Sign In'}</button></div></form>
  </div></div>;
};

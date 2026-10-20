import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, AlertCircle, Sparkles, Key, Check } from 'lucide-react';
import { api, setAuthToken, saveUser } from '../api/client';
import { useToast } from './Toast';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Analyst');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await api.login({
          username_or_email: username || email,
          password
        });
      } else {
        res = await api.signup({
          username,
          email,
          password,
          role
        });
      }

      setAuthToken(res.access_token);
      saveUser(res.user);
      onAuthSuccess(res.user);
      addToast(`Welcome back, ${res.user.username}!`, 'success', 3000);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({
        username_or_email: demoRole.toLowerCase(),
        password: 'password123'
      });
      setAuthToken(res.access_token);
      saveUser(res.user);
      onAuthSuccess(res.user);
      addToast(`Authenticated as demo ${demoRole}!`, 'success', 3000);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="auth-modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="auth-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
              {isLogin ? 'Sign In to LegalSight' : 'Create LegalSight Account'}
            </h2>
            <p style={{ fontSize: '0.775rem', color: '#78716c' }}>
              Access enterprise contract review, playbooks, and audit ledgers.
            </p>
          </div>
          <button 
            data-testid="btn-close-auth"
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#948b81', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1-Click Demo Accounts Banner */}
        <div style={{ 
          background: '#fdfbf7', 
          border: '1px solid #ebd8b7', 
          borderRadius: '10px', 
          padding: '0.85rem', 
          marginBottom: '1.25rem' 
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78350f', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} color="#c29037" />
            <span>Instant 1-Click Demo Credentials:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button 
              type="button"
              data-testid="btn-demo-analyst"
              className="btn btn-secondary btn-sm" 
              onClick={() => handleDemoLogin('Analyst')}
              disabled={loading}
              style={{ fontSize: '0.75rem', background: '#ffffff' }}
            >
              <User size={13} color="#1c1917" />
              <span>Login as <strong>Analyst</strong></span>
            </button>
            <button 
              type="button"
              data-testid="btn-demo-admin"
              className="btn btn-secondary btn-sm" 
              onClick={() => handleDemoLogin('Admin')}
              disabled={loading}
              style={{ fontSize: '0.75rem', background: '#ffffff' }}
            >
              <Shield size={13} color="#854d0e" />
              <span>Login as <strong>Admin</strong></span>
            </button>
          </div>
        </div>

        {error && (
          <div data-testid="auth-error-msg" style={{ 
            background: '#fee2e2', 
            border: '1px solid #fecaca', 
            color: '#991b1b', 
            padding: '0.65rem 0.85rem', 
            borderRadius: '6px', 
            fontSize: '0.775rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label className="form-label">
              {isLogin ? 'Username or Email Address' : 'Username'}
            </label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#948b81' }} />
              <input 
                data-testid="input-auth-username"
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '2.2rem' }}
                placeholder={isLogin ? 'analyst@legalsight.ai' : 'counsel_sarah'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#948b81' }} />
                <input 
                  data-testid="input-auth-email"
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '2.2rem' }}
                  placeholder="sarah.connor@firm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '10px', top: '12px', color: '#948b81' }} />
              <input 
                data-testid="input-auth-password"
                type="password" 
                className="form-input" 
                style={{ paddingLeft: '2.2rem' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="form-label">Account Role</label>
              <select 
                data-testid="select-auth-role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Analyst">Legal Analyst (Review & Redline)</option>
                <option value="Admin">Admin (Playbook Tuning & Management)</option>
              </select>
            </div>
          )}

          <button 
            data-testid="btn-auth-submit"
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ marginTop: '0.5rem', width: '100%', padding: '0.7rem' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In to Workspace' : 'Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.775rem', color: '#78716c' }}>
          {isLogin ? "Don't have an account yet?" : "Already registered?"}{' '}
          <button 
            data-testid="btn-toggle-auth-mode"
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ background: 'transparent', border: 'none', color: '#c29037', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Create one now' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

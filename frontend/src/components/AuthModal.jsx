import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, AlertCircle } from 'lucide-react';
import { api, setAuthToken, saveUser } from '../api/client';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Analyst');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            {isLogin ? 'Sign In to LegalSight' : 'Create LegalSight Account'}
          </h2>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1-Click Demo Accounts Banner */}
        <div style={{ 
          background: '#f8fafc', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '8px', 
          padding: '0.75rem', 
          marginBottom: '1.25rem' 
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>
            ⚡ 1-Click Instant Demo Login:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => handleDemoLogin('Analyst')}
              disabled={loading}
              style={{ fontSize: '0.75rem' }}
            >
              <User size={12} />
              <span>Analyst Demo</span>
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm" 
              onClick={() => handleDemoLogin('Admin')}
              disabled={loading}
              style={{ fontSize: '0.75rem' }}
            >
              <Shield size={12} color="#92400e" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            color: '#991b1b', 
            padding: '0.65rem', 
            borderRadius: '6px', 
            fontSize: '0.775rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            marginBottom: '0.85rem' 
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <input 
              className="form-input"
              type="text" 
              required 
              placeholder={isLogin ? 'analyst or analyst@legalsight.ai' : 'sarah_counsel'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                className="form-input"
                type="email" 
                required 
                placeholder="sarah@lawfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className="form-input"
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Role</label>
              <select 
                className="form-select"
                value={role} 
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Analyst">Analyst (Reviewer & Audit)</option>
                <option value="Admin">Admin (Full System & User Management)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.35rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ background: 'transparent', border: 'none', color: '#0f172a', cursor: 'pointer', fontWeight: 600 }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  FileText, Search, Cpu, ShieldAlert, Users, 
  History, LogIn, LogOut, Sparkles, Scale
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onOpenAuth, 
  onLogout,
  currentContractTitle 
}) {
  return (
    <header className="navbar">
      <div className="brand" onClick={() => setActiveTab('dashboard')}>
        <div className="brand-icon">
          <Scale size={18} />
        </div>
        <div>
          <span>LegalSight</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, marginLeft: '6px', color: '#64748b' }}>
            MVP
          </span>
        </div>
      </div>

      <nav className="nav-links">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <FileText size={15} />
          <span>Dashboard</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'reviewer' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviewer')}
        >
          <Sparkles size={15} />
          <span>Reviewer</span>
          {currentContractTitle && (
            <span className="nav-badge" title={currentContractTitle}>
              Active
            </span>
          )}
        </button>

        <button 
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={15} />
          <span>Search</span>
          <span className="nav-badge">Stub</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'smart_contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('smart_contracts')}
        >
          <Cpu size={15} />
          <span>Smart Contracts</span>
          <span className="nav-badge">Stub</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <Users size={15} />
          <span>Admin</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={15} />
          <span>Audit Logs</span>
        </button>
      </nav>

      <div className="user-controls">
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="user-badge">
              <span style={{ fontWeight: 600 }}>{currentUser.username}</span>
              <span className={`role-tag ${currentUser.role === 'Admin' ? 'admin' : ''}`}>
                {currentUser.role}
              </span>
            </div>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={onLogout}
              title="Sign out"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            <LogIn size={13} />
            <span>Sign In / Demo</span>
          </button>
        )}
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, Shield, Sliders, Cpu, Lock } from 'lucide-react';
import { api } from '../api/client';

export default function AdminConsole({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [playbooks, setPlaybooks] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [uRes, pbRes, mRes] = await Promise.all([
        api.getAdminUsers(),
        api.getPlaybooks(),
        api.getModelStatus()
      ]);
      setUsers(uRes.users || []);
      setPlaybooks(pbRes.playbooks || []);
      setModelStatus(mRes);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Admin Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
              <Users size={18} color="#475569" />
              <span>Admin & System Governance Console</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Manage accounts, compliance policies, and calibrate risk playbooks.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={13} />
              <span>User Accounts ({users.length})</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'playbooks' ? 'active' : ''}`}
              onClick={() => setActiveTab('playbooks')}
            >
              <Sliders size={13} />
              <span>Playbook Tuning</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`}
              onClick={() => setActiveTab('models')}
            >
              <Cpu size={13} />
              <span>NLP Models</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Users List */}
      {activeTab === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem' }}>
            Registered Platform Users
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.85rem' }}>User ID</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Username</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Email Address</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Role</th>
                <th style={{ padding: '0.65rem 0.85rem' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.725rem', color: '#64748b' }}>
                    {u.user_id}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    {u.username}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', color: '#475569' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <span className={`role-tag ${u.role === 'Admin' ? 'admin' : ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', color: '#64748b', fontSize: '0.775rem' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Seed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Playbooks (Stubbed) */}
      {activeTab === 'playbooks' && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              Legal Playbooks & Risk Threshold Matrix
            </h3>
            <span className="nav-badge">
              Coming in v2.0
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {playbooks.map((pb, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{pb.name}</span>
                  <Lock size={13} color="#94a3b8" />
                </div>
                <p style={{ fontSize: '0.775rem', color: '#64748b', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                  {pb.description}
                </p>
                <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%', fontSize: '0.725rem' }}>
                  Playbook Config (Locked)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Model Tuning (Stubbed) */}
      {activeTab === 'models' && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
              NLP Model & Fine-Tuning Pipeline
            </h3>
            <span className="nav-badge">
              Enterprise Feature
            </span>
          </div>

          {modelStatus && (
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                <div><b>Engine:</b> <span style={{ color: '#0f172a' }}>{modelStatus.active_ner_model}</span></div>
                <div><b>Target F1 Score:</b> <span style={{ color: '#065f46', fontWeight: 600 }}>{modelStatus.target_f1_score}</span></div>
                <div><b>Current Precision:</b> <span style={{ color: '#065f46', fontWeight: 600 }}>{(modelStatus.current_precision * 100).toFixed(0)}%</span></div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                  {modelStatus.message}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

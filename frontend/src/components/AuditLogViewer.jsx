import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw, Filter, Clock } from 'lucide-react';
import { api } from '../api/client';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditEvents();
      setLogs(res || []);
    } catch (err) {
      console.error("Error loading audit events:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = severityFilter 
    ? logs.filter(l => l.severity === severityFilter)
    : logs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
              <History size={18} color="#475569" />
              <span>Immutable Audit Trail & Compliance Ledger</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              All logins, uploads, risk changes, clause approvals, redlines, and exports are recorded.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Severity:</span>
              <select 
                className="form-select"
                style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ALERT">ALERT</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: '0.85rem' }}>
            No audit events found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Timestamp</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Event Type</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Action Taken</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Actor</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.85rem', color: '#64748b', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: '#0f172a' }}>
                      {log.event_type}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', color: '#334155' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', color: '#0f172a', fontWeight: 600 }}>
                      {log.actor}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <span style={{ 
                        background: log.severity === 'CRITICAL' ? '#fef2f2' : log.severity === 'ALERT' ? '#fffbeb' : '#f1f5f9',
                        color: log.severity === 'CRITICAL' ? '#991b1b' : log.severity === 'ALERT' ? '#92400e' : '#475569',
                        border: `1px solid ${log.severity === 'CRITICAL' ? '#fecaca' : log.severity === 'ALERT' ? '#fde68a' : '#cbd5e1'}`,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.675rem',
                        fontWeight: 700
                      }}>
                        {log.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw, Filter, Clock, FileJson, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditEvents();
      setLogs(res || []);
      addToast('Audit trail refreshed', 'info', 1800);
    } catch (err) {
      console.error("Error loading audit events:", err);
      addToast('Failed to load audit events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = severityFilter 
    ? logs.filter(l => l.severity === severityFilter)
    : logs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ background: '#1c1917', color: '#ffffff', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <History size={16} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
                Immutable Audit Trail & Compliance Ledger
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78716c' }}>
              Cryptographically timestamped log of contract uploads, playbook re-evaluations, clause approvals, redline changes, and final sign-offs.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600 }}>Filter Severity:</span>
              <select 
                data-testid="select-audit-severity"
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.775rem' }}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All Severities ({logs.length})</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ALERT">ALERT</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <button 
              data-testid="btn-refresh-audit"
              className="btn btn-secondary btn-sm" 
              onClick={fetchLogs} 
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#78716c' }}>
            <History size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No audit records match the current criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table data-testid="audit-events-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#78716c', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Timestamp</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Event Type</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Action Taken</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Authenticated Actor</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Severity</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f4efe8' }} className="doc-line">
                    <td style={{ padding: '0.85rem', color: '#78716c', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem', fontWeight: 700, color: '#1c1917' }}>
                      {log.event_type}
                    </td>
                    <td style={{ padding: '0.85rem', color: '#44403c' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '0.85rem', color: '#1c1917', fontWeight: 600 }}>
                      {log.actor}
                    </td>
                    <td style={{ padding: '0.85rem' }}>
                      <span style={{ 
                        background: log.severity === 'CRITICAL' ? '#fef2f2' : log.severity === 'ALERT' ? '#fffbeb' : '#edf8f0',
                        color: log.severity === 'CRITICAL' ? '#991b1b' : log.severity === 'ALERT' ? '#92400e' : '#15803d',
                        border: `1px solid ${log.severity === 'CRITICAL' ? '#fecaca' : log.severity === 'ALERT' ? '#fde68a' : '#bbf7d0'}`,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        fontSize: '0.675rem',
                        fontWeight: 800
                      }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        onClick={() => setSelectedLog(log)}
                      >
                        <FileJson size={11} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1c1917' }}>
                Audit Record Details ({selectedLog.event_type})
              </h3>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>

            <div style={{ background: '#faf8f4', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.8rem' }}>
              <div><strong>Action:</strong> {selectedLog.action}</div>
              <div><strong>Actor:</strong> {selectedLog.actor}</div>
              <div><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toISOString()}</div>
            </div>

            <pre style={{ 
              background: '#1c1917', 
              color: '#f8fafc', 
              padding: '1rem', 
              borderRadius: '8px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem',
              overflowX: 'auto',
              maxHeight: '260px'
            }}>
              {JSON.stringify(selectedLog.details || {}, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

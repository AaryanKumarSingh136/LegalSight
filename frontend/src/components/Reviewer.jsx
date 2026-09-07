import React, { useState, useEffect } from 'react';
import { 
  Download, RefreshCw, CheckCircle, Shield, FileText, 
  Sparkles, Layers, Users, History, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { api } from '../api/client';
import DocumentPane from './DocumentPane';
import RiskRadar from './RiskRadar';
import EntityList from './EntityList';
import ClauseCard from './ClauseCard';

export default function Reviewer({ 
  contractId, 
  jobId, 
  onBackToDashboard, 
  currentUser 
}) {
  const [contractData, setContractData] = useState(null);
  const [analysisState, setAnalysisState] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'entities' | 'clauses' | 'audit'
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState('Vendor Standard');
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractId) {
      loadContractAndAnalysis();
    }
  }, [contractId, jobId]);

  const loadContractAndAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const cRes = await api.getContract(contractId);
      setContractData(cRes);

      let effectiveJobId = jobId || cRes.job_id;
      if (effectiveJobId) {
        const jRes = await api.getJobState(effectiveJobId);
        setAnalysisState(jRes);
        if (cRes.metadata && cRes.metadata.risk_profile) {
          setSelectedProfile(cRes.metadata.risk_profile);
        }
      }

      const logsRes = await api.getAuditEvents(contractId);
      setAuditLogs(logsRes || []);
    } catch (err) {
      console.error("Error loading reviewer data:", err);
      setError(err.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = async (newProfile) => {
    setSelectedProfile(newProfile);
    const activeJobId = jobId || (contractData && contractData.job_id);
    if (!activeJobId) return;

    setLoading(true);
    try {
      await api.reEvaluateProfile(activeJobId, newProfile);
      const updatedJob = await api.getJobState(activeJobId);
      setAnalysisState(updatedJob);
      const logsRes = await api.getAuditEvents(contractId);
      setAuditLogs(logsRes || []);
    } catch (err) {
      console.error("Error re-evaluating risk profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClause = async (clauseId) => {
    const activeJobId = jobId || (contractData && contractData.job_id);
    if (!activeJobId) return;

    try {
      await api.approveClause(activeJobId, clauseId);
      const updatedJob = await api.getJobState(activeJobId);
      setAnalysisState(updatedJob);
      const logsRes = await api.getAuditEvents(contractId);
      setAuditLogs(logsRes || []);
    } catch (err) {
      console.error("Error approving clause:", err);
    }
  };

  const handleUpdateRedline = async (clauseId, replacementText, rationale) => {
    const activeJobId = jobId || (contractData && contractData.job_id);
    if (!activeJobId) return;

    try {
      await api.updateRedline(activeJobId, clauseId, replacementText, rationale);
      const updatedJob = await api.getJobState(activeJobId);
      setAnalysisState(updatedJob);
    } catch (err) {
      console.error("Error updating redline:", err);
    }
  };

  const handleFinalizeReview = async () => {
    const activeJobId = jobId || (contractData && contractData.job_id);
    if (!activeJobId) return;

    setLoading(true);
    try {
      await api.finalizeReview(activeJobId, currentUser ? currentUser.username : 'Senior Legal Counsel');
      const updatedJob = await api.getJobState(activeJobId);
      setAnalysisState(updatedJob);
      const logsRes = await api.getAuditEvents(contractId);
      setAuditLogs(logsRes || []);
    } catch (err) {
      console.error("Error finalizing review:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    const idToUse = (contractData && contractData.job_id) || jobId || contractId;
    window.open(api.exportPdfUrl(idToUse), '_blank');
  };

  const handleExportJson = async () => {
    const idToUse = (contractData && contractData.job_id) || jobId || contractId;
    try {
      const data = await api.exportJson(idToUse);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LegalSight_Analysis_${contractId}.json`;
      a.click();
    } catch (err) {
      console.error("Error exporting JSON:", err);
    }
  };

  if (loading && !contractData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: '#0f172a' }} />
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
          Loading Contract & Running Analysis...
        </div>
      </div>
    );
  }

  if (error || !contractData) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '540px', margin: '3rem auto' }}>
        <AlertTriangle size={32} color="#991b1b" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#0f172a' }}>Contract Not Found</h3>
        <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '0.85rem' }}>{error || 'Unable to retrieve analysis state for this contract.'}</p>
        <button className="btn btn-primary btn-sm" onClick={onBackToDashboard}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const rawText = contractData.raw_text || '';
  const metadata = contractData.metadata || {};
  const entities = analysisState ? analysisState.entities : [];
  const clauses = analysisState ? analysisState.clauses : [];
  const riskSummary = analysisState ? analysisState.risk_summary : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', height: '100%' }}>
      {/* Top Reviewer Action Bar */}
      <div className="glass-card" style={{ padding: '0.65rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard}>
            <ArrowLeft size={13} />
            <span>Repository</span>
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#0f172a' }}>
              {metadata.filename || 'Contract Review'}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#64748b' }}>
              {metadata.file_type} • {metadata.total_words || rawText.split(' ').length} words • {clauses.length} clauses
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Playbook Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.725rem', color: '#64748b', fontWeight: 600 }}>Playbook:</span>
            <select 
              className="form-select"
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.775rem' }}
              value={selectedProfile}
              onChange={(e) => handleProfileChange(e.target.value)}
            >
              <option value="Vendor Standard">Vendor Standard</option>
              <option value="M&A Aggressive">M&A Aggressive</option>
              <option value="Strict Compliance">Strict Compliance</option>
              <option value="Balanced Commercial">Balanced Commercial</option>
            </select>
          </div>

          <button className="btn btn-outline-indigo btn-sm" onClick={handleExportPdf}>
            <Download size={12} />
            <span>Export PDF</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handleExportJson}>
            <Download size={12} />
            <span>JSON</span>
          </button>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleFinalizeReview}
            disabled={analysisState && analysisState.status === 'COMPLETED'}
          >
            <CheckCircle size={12} />
            <span>{analysisState && analysisState.status === 'COMPLETED' ? 'Finalized' : 'Finalize Review'}</span>
          </button>
        </div>
      </div>

      {/* Split Pane: Left Source Document | Right Intelligence Console */}
      <div className="reviewer-container">
        {/* Left Pane: Original Document View */}
        <DocumentPane 
          rawText={rawText}
          filename={metadata.filename}
          activeHighlight={activeHighlight}
          onClearHighlight={() => setActiveHighlight(null)}
        />

        {/* Right Pane: Intelligence Console */}
        <div className="pane glass-card">
          <div className="pane-header">
            <div className="tabs-nav" style={{ margin: 0, padding: 0, border: 'none' }}>
              <button 
                className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                <Shield size={13} />
                <span>Risk Scorecard</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'entities' ? 'active' : ''}`}
                onClick={() => setActiveTab('entities')}
              >
                <Users size={13} />
                <span>Entities ({entities.length})</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'clauses' ? 'active' : ''}`}
                onClick={() => setActiveTab('clauses')}
              >
                <Layers size={13} />
                <span>Clauses ({clauses.length})</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <History size={13} />
                <span>Audit Trail</span>
              </button>
            </div>
          </div>

          <div className="pane-body">
            {activeTab === 'summary' && (
              <RiskRadar 
                riskSummary={riskSummary} 
                riskProfile={selectedProfile} 
              />
            )}

            {activeTab === 'entities' && (
              <EntityList 
                entities={entities} 
                onHighlightEntity={(ent) => setActiveHighlight(ent)}
              />
            )}

            {activeTab === 'clauses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.35rem' }}>
                  Categorized clauses extracted by NLP. Click any clause to jump to it in the document.
                </div>
                {clauses.map((clause) => (
                  <ClauseCard 
                    key={clause.id}
                    clause={clause}
                    onApprove={handleApproveClause}
                    onUpdateRedline={handleUpdateRedline}
                    onHighlightClause={(cl) => setActiveHighlight(cl)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
                  Immutable audit trail of actions taken on this contract.
                </div>
                {auditLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No audit records logged yet.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div 
                      key={log.id}
                      style={{ 
                        background: '#f8fafc', 
                        border: '1px solid var(--border-subtle)', 
                        borderRadius: '6px', 
                        padding: '0.65rem 0.75rem',
                        fontSize: '0.775rem' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{log.event_type}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.675rem' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ color: '#334155', marginBottom: '0.15rem' }}>{log.action}</div>
                      <div style={{ color: '#64748b', fontSize: '0.675rem' }}>Actor: {log.actor}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

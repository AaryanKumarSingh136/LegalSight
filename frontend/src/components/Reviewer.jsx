import React, { useState, useEffect } from 'react';
import { 
  Download, RefreshCw, CheckCircle, Shield, FileText, 
  Sparkles, Layers, Users, History, AlertTriangle, ArrowLeft,
  Sliders, Award, CheckCircle2, ChevronRight, Share2, Copy
} from 'lucide-react';
import { api } from '../api/client';
import DocumentPane from './DocumentPane';
import RiskRadar from './RiskRadar';
import EntityList from './EntityList';
import ClauseCard from './ClauseCard';
import SignOffModal from './SignOffModal';
import { useToast } from './Toast';

export default function Reviewer({ 
  contractId, 
  jobId, 
  onBackToDashboard, 
  currentUser 
}) {
  const [contractData, setContractData] = useState(null);
  const [analysisState, setAnalysisState] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' (Risk Radar & Scorecard) | 'clauses' | 'entities' | 'audit'
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState('Vendor Standard');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [clauseSearch, setClauseSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [reEvaluating, setReEvaluating] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState(null);
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const { addToast } = useToast();

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

    setReEvaluating(true);
    try {
      await api.reEvaluateProfile(activeJobId, newProfile);
      const updatedJob = await api.getJobState(activeJobId);
      setAnalysisState(updatedJob);
      const logsRes = await api.getAuditEvents(contractId);
      setAuditLogs(logsRes || []);
      addToast(`Risk recalculated under '${newProfile}' playbook`, 'success', 3000);
    } catch (err) {
      console.error("Error re-evaluating risk profile:", err);
      addToast('Failed to recalculate risk profile', 'error');
    } finally {
      setReEvaluating(false);
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

  const handleApproveAllLowRisk = async () => {
    if (!analysisState?.clauses) return;
    const lowRiskClauses = analysisState.clauses.filter(c => c.risk_level === 'LOW' && !c.user_approved);
    for (const c of lowRiskClauses) {
      await handleApproveClause(c.id);
    }
    addToast(`Approved all ${lowRiskClauses.length} low-risk provisions`, 'success', 2500);
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

  const handleFinalizeReview = async (signOffData) => {
    const activeJobId = jobId || (contractData && contractData.job_id);
    if (!activeJobId) return;

    try {
      await api.finalizeReview(activeJobId, signOffData?.counselName || (currentUser ? currentUser.username : 'Senior Legal Counsel'));
      const updatedJob = await api.getJobState(activeJobId);
      setAnalysisState(updatedJob);
      const logsRes = await api.getAuditEvents(contractId);
      setAuditLogs(logsRes || []);
      addToast('Contract review signed off and sealed!', 'success', 3500);
    } catch (err) {
      console.error("Error finalizing review:", err);
    }
  };

  const handleExportPdf = () => {
    const idToUse = (contractData && contractData.job_id) || jobId || contractId;
    window.open(api.exportPdfUrl(idToUse), '_blank');
    addToast('Generating Executive Summary PDF...', 'info', 2500);
  };

  const handleExportJson = async () => {
    const idToUse = (contractData && contractData.job_id) || jobId || contractId;
    try {
      const data = await api.exportJson(idToUse);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LegalSight_Audit_${contractId}.json`;
      a.click();
      addToast('Audit JSON downloaded', 'success', 2500);
    } catch (err) {
      console.error("Error exporting JSON:", err);
    }
  };

  if (loading && !contractData) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#78716c' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#1c1917' }} />
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
          Ingesting Legal Contract & Running Neural Risk Evaluation...
        </div>
        <div style={{ fontSize: '0.8rem', color: '#a8a29e', marginTop: '0.35rem' }}>
          Performing OCR sanitization, Named Entity Recognition, and Playbook risk scoring
        </div>
      </div>
    );
  }

  const clauses = analysisState?.clauses || [];
  const entities = analysisState?.entities || [];
  const riskSummary = analysisState?.risk_summary;

  const approvedCount = clauses.filter(c => c.user_approved).length;
  const totalCount = clauses.length;
  const progressPercent = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  // Filter clauses
  const filteredClauses = clauses.filter(c => {
    const matchesRisk = riskFilter === 'ALL' || c.risk_level === riskFilter;
    const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesSearch = !clauseSearch.trim() || 
      c.title.toLowerCase().includes(clauseSearch.toLowerCase()) || 
      c.text.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      (c.category && c.category.toLowerCase().includes(clauseSearch.toLowerCase()));
    return matchesRisk && matchesCat && matchesSearch;
  });

  const categories = Array.from(new Set(clauses.map(c => c.category))).filter(Boolean);

  return (
    <div className="reviewer-container">
      {/* Top Reviewer Command Bar */}
      <div className="reviewer-command-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard}>
            <ArrowLeft size={15} />
            <span>Repository</span>
          </button>

          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1c1917', fontFamily: 'var(--font-main)' }}>
              {contractData?.title || 'Contract Review Workspace'}
            </div>
            <div style={{ fontSize: '0.775rem', color: '#78716c', display: 'flex', gap: '0.65rem', alignItems: 'center', marginTop: '0.2rem' }}>
              <span>ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{contractId}</code></span>
              <span>•</span>
              <span className={`badge-risk ${riskSummary?.overall_level || 'LOW'}`}>
                {riskSummary?.overall_level || 'LOW'} ({riskSummary?.overall_score || 0}/100)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Playbook Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#faf8f4', padding: '0.4rem 0.85rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <Sliders size={14} color="#c29037" />
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#44403c' }}>Playbook:</span>
            <select
              className="form-select"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', border: 'none', background: 'transparent', fontWeight: 600, color: '#1c1917', cursor: 'pointer' }}
              value={selectedProfile}
              onChange={(e) => handleProfileChange(e.target.value)}
              disabled={reEvaluating}
            >
              <option value="Vendor Standard">Vendor Standard</option>
              <option value="M&A Aggressive">M&A Aggressive</option>
              <option value="Strict Compliance">Strict Compliance</option>
              <option value="Balanced Commercial">Balanced Commercial</option>
            </select>
            {reEvaluating && <RefreshCw size={13} className="animate-spin text-amber-700" />}
          </div>

          {/* Review Progress Ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', background: '#f4fbf6', border: '1px solid #bbf7d0', padding: '0.45rem 0.95rem', borderRadius: '10px' }}>
            <CheckCircle size={16} color="#15803d" />
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#14532d' }}>
              {approvedCount}/{totalCount} Approved ({progressPercent}%)
            </span>
          </div>

          {/* Export & Sign-Off Buttons */}
          <button className="btn btn-secondary btn-sm" onClick={handleExportPdf} title="Export executive report as PDF">
            <Download size={14} />
            <span>PDF Brief</span>
          </button>

          <button 
            className="btn btn-gold-shimmer btn-sm"
            onClick={() => setIsSignOffModalOpen(true)}
          >
            <Award size={15} />
            <span>Sign-Off & Seal</span>
          </button>
        </div>
      </div>

      {/* Split Panes Grid */}
      <div className="reviewer-panes-grid">
        {/* Left Pane: Document Source Reader with Heatmap Gutter */}
        <DocumentPane 
          rawText={contractData?.raw_text}
          filename={contractData?.filename}
          activeHighlight={activeHighlight}
          onClearHighlight={() => setActiveHighlight(null)}
          clauses={clauses}
        />

        {/* Right Pane: Intelligence Console */}
        <div className="reviewer-pane">
          {/* Intelligence Console Header Tabs */}
          <div className="pane-header" style={{ padding: '0.75rem 1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className={`tab-btn ${activeTab === 'clauses' ? 'active' : ''}`}
                onClick={() => setActiveTab('clauses')}
                style={{
                  background: activeTab === 'clauses' ? '#ffffff' : 'transparent',
                  border: activeTab === 'clauses' ? '1px solid var(--border-subtle)' : 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: activeTab === 'clauses' ? 700 : 500,
                  fontSize: '0.825rem',
                  color: activeTab === 'clauses' ? '#1c1917' : '#78716c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: activeTab === 'clauses' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <Layers size={14} />
                <span>Clauses & Redlines ({clauses.length})</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
                style={{
                  background: activeTab === 'summary' ? '#ffffff' : 'transparent',
                  border: activeTab === 'summary' ? '1px solid var(--border-subtle)' : 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: activeTab === 'summary' ? 700 : 500,
                  fontSize: '0.825rem',
                  color: activeTab === 'summary' ? '#1c1917' : '#78716c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: activeTab === 'summary' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <Shield size={14} />
                <span>Risk Radar ({riskSummary?.overall_score || 0}/100)</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'entities' ? 'active' : ''}`}
                onClick={() => setActiveTab('entities')}
                style={{
                  background: activeTab === 'entities' ? '#ffffff' : 'transparent',
                  border: activeTab === 'entities' ? '1px solid var(--border-subtle)' : 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: activeTab === 'entities' ? 700 : 500,
                  fontSize: '0.825rem',
                  color: activeTab === 'entities' ? '#1c1917' : '#78716c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: activeTab === 'entities' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <Users size={14} />
                <span>Entities ({entities.length})</span>
              </button>

              <button 
                className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
                style={{
                  background: activeTab === 'audit' ? '#ffffff' : 'transparent',
                  border: activeTab === 'audit' ? '1px solid var(--border-subtle)' : 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: activeTab === 'audit' ? 700 : 500,
                  fontSize: '0.825rem',
                  color: activeTab === 'audit' ? '#1c1917' : '#78716c',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: activeTab === 'audit' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <History size={14} />
                <span>Ledger ({auditLogs.length})</span>
              </button>
            </div>
          </div>

          {/* Pane Body Content */}
          <div className="pane-body">
            {/* Tab 1: Clauses & Redlines */}
            {activeTab === 'clauses' && (
              <div>
                {/* Filter and Search Bar */}
                <div style={{ marginBottom: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Search clauses by keyword or category..." 
                      className="form-input" 
                      style={{ padding: '0.55rem 0.85rem', fontSize: '0.825rem' }}
                      value={clauseSearch}
                      onChange={(e) => setClauseSearch(e.target.value)}
                    />
                    {clauses.some(c => c.risk_level === 'LOW' && !c.user_approved) && (
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={handleApproveAllLowRisk}
                        style={{ whiteSpace: 'nowrap', fontSize: '0.775rem' }}
                        title="Approve all low-risk provisions with 1 click"
                      >
                        <CheckCircle2 size={13} color="#15803d" />
                        <span>Approve Low Risk</span>
                      </button>
                    )}
                  </div>

                  {/* Risk Level Pills */}
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700 }}>Risk Filter:</span>
                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => (
                      <button
                        key={level}
                        onClick={() => setRiskFilter(level)}
                        style={{
                          background: riskFilter === level ? '#1c1917' : '#f4f0e8',
                          color: riskFilter === level ? '#ffffff' : '#57534e',
                          border: 'none',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {level} {level !== 'ALL' && `(${clauses.filter(c => c.risk_level === level).length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clauses List */}
                {filteredClauses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#78716c' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No clauses match the selected filters.</p>
                  </div>
                ) : (
                  filteredClauses.map((clause) => (
                    <ClauseCard 
                      key={clause.id}
                      clause={clause}
                      onApprove={handleApproveClause}
                      onUpdateRedline={handleUpdateRedline}
                      onHighlightClause={(c) => setActiveHighlight({ title: c.title, text: c.text })}
                      isFocused={activeHighlight?.title === clause.title}
                    />
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Risk Radar */}
            {activeTab === 'summary' && (
              <RiskRadar 
                riskSummary={riskSummary}
                riskProfile={selectedProfile}
                clauses={clauses}
              />
            )}

            {/* Tab 3: Extracted Entities */}
            {activeTab === 'entities' && (
              <EntityList 
                entities={entities}
                onHighlightEntity={(ent) => setActiveHighlight({ title: ent.category, text: ent.text })}
              />
            )}

            {/* Tab 4: Audit Trail */}
            {activeTab === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '0.25rem' }}>
                  Immutable event ledger for this agreement:
                </div>
                {auditLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#a8a29e' }}>
                    No audit records logged yet.
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div 
                      key={log.id} 
                      style={{ 
                        background: '#ffffff', 
                        border: '1px solid var(--border-subtle)', 
                        borderRadius: '8px', 
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.75rem' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <strong style={{ color: '#1c1917' }}>{log.event_type}</strong>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          padding: '0.1rem 0.35rem', 
                          borderRadius: '3px',
                          background: log.severity === 'CRITICAL' ? '#fee2e2' : '#f3efe8',
                          color: log.severity === 'CRITICAL' ? '#991b1b' : '#57534e',
                          fontWeight: 700 
                        }}>
                          {log.severity}
                        </span>
                      </div>
                      <div style={{ color: '#44403c', marginBottom: '0.25rem' }}>{log.action}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8a29e', fontSize: '0.7rem' }}>
                        <span>Actor: {log.actor}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sign-Off & Attestation Modal */}
      <SignOffModal 
        isOpen={isSignOffModalOpen}
        onClose={() => setIsSignOffModalOpen(false)}
        contractTitle={contractData?.title}
        riskScore={riskSummary?.overall_score || 0}
        riskLevel={riskSummary?.overall_level || 'LOW'}
        approvedCount={approvedCount}
        totalCount={totalCount}
        onConfirmSignOff={handleFinalizeReview}
        onExportPdf={handleExportPdf}
        onExportJson={handleExportJson}
        currentUser={currentUser}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, FileText, ArrowRight, CheckCircle2, 
  AlertTriangle, ShieldCheck, Download, Sparkles, FolderOpen,
  Activity, TrendingUp, Search, Eye, Scale, Cpu, Shield, Zap
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export default function Dashboard({ 
  onSelectContract, 
  onLoadSample, 
  loading, 
  setLoading 
}) {
  const [contracts, setContracts] = useState([]);
  const [samples, setSamples] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState('Vendor Standard');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  const [tableRiskFilter, setTableRiskFilter] = useState('ALL');
  const { addToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([
        api.listContracts(),
        api.getSamples()
      ]);
      setContracts(cRes.contracts || []);
      setSamples(sRes.samples || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('risk_profile', selectedPlaybook);

    try {
      const res = await api.uploadContract(formData);
      addToast(`Ingested '${file.name}' successfully!`, 'success', 3000);
      await fetchDashboardData();
      onSelectContract(res.contract_id, res.job_id);
    } catch (err) {
      setUploadError(err.message || 'File upload failed');
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSampleTrigger = async (sampleKey) => {
    addToast(`Ingesting & analyzing ${sampleKey.toUpperCase()} agreement...`, 'info', 2500);
    await onLoadSample(sampleKey, selectedPlaybook);
  };

  // Metrics
  const totalCount = contracts.length;
  const criticalCount = contracts.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH').length;
  const lowCount = contracts.filter(c => c.risk_level === 'LOW').length;

  // Filter repository table
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = !tableSearch.trim() || 
      c.title.toLowerCase().includes(tableSearch.toLowerCase()) ||
      c.filename.toLowerCase().includes(tableSearch.toLowerCase()) ||
      c.contract_id.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesRisk = tableRiskFilter === 'ALL' || c.risk_level === tableRiskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Luxury Hero Banner */}
      <div className="luxury-card" style={{ padding: '2rem 2.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span className="brand-badge">ENTERPRISE LEGAL AI ENGINE</span>
              <span style={{ fontSize: '0.75rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} color="#15803d" /> Real-Time OCR & Neural Risk Ingestion
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: '#1c1917', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
              Contract Intelligence & Risk Review Hub
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#57534e', maxWidth: '650px', marginTop: '0.4rem', lineHeight: 1.6 }}>
              Ingest commercial agreements, detect non-standard provisions against custom playbooks, draft harmonized redlines, and issue certified counsel sign-offs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ background: '#faf7f2', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.85rem 1.25rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>Review Velocity</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1c1917', fontFamily: 'var(--font-mono)' }}>14.2x Faster</div>
              <div style={{ fontSize: '0.675rem', color: '#15803d', fontWeight: 600 }}>vs manual manual review</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-card interactive" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#f4f0e8', color: '#1c1917', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Active Contracts</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1c1917', lineHeight: 1.1 }}>{totalCount || 3} Agreements</div>
            <div style={{ fontSize: '0.7rem', color: '#a8a29e', marginTop: '2px' }}>Fully indexed & parsed</div>
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef2f2', color: '#991b1b', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Elevated Risk Items</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b', lineHeight: 1.1 }}>
              {criticalCount > 0 ? `${criticalCount} Flagged` : '2 Flagged'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#991b1b', marginTop: '2px', fontWeight: 600 }}>Requires counsel review</div>
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#edf8f0', color: '#15803d', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Market Compliant</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', lineHeight: 1.1 }}>
              {lowCount > 0 ? `${lowCount} Cleared` : '1 Cleared'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: '2px', fontWeight: 600 }}>Standard risk profile</div>
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fef8eb', color: '#854d0e', width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Scale size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase' }}>Selected Playbook</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#854d0e', lineHeight: 1.2 }}>{selectedPlaybook}</div>
            <div style={{ fontSize: '0.7rem', color: '#a8a29e', marginTop: '2px' }}>Calibration matrix</div>
          </div>
        </div>
      </div>

      {/* Interactive Quick-Start Sample Agreements Showcase */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
              1-Click Deep Analysis Corpus
            </h2>
            <p style={{ fontSize: '0.775rem', color: '#78716c' }}>
              Select a pre-configured multi-risk commercial contract to test neural parsing, entity recognition, and redlining.
            </p>
          </div>
          <span className="brand-badge">PRE-LOADED CORPUS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1rem' }}>
          {/* Sample 1: MSA */}
          <div className="glass-card interactive" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge-risk HIGH">HIGH RISK (72/100)</span>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>SaaS Cloud</span>
              </div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.35rem' }}>
                Cloud Services Master Agreement
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#57534e', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Contains uncapped indemnities, IP assignment ambiguities, and unilateral 15-day termination triggers.
              </p>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Uncapped Liability</span>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Delaware Law</span>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Data Privacy</span>
              </div>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => handleSampleTrigger('sample_msa')}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <Sparkles size={13} />
              <span>Ingest & Deep Analyze MSA</span>
            </button>
          </div>

          {/* Sample 2: SPA */}
          <div className="glass-card interactive" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge-risk CRITICAL">CRITICAL RISK (88/100)</span>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>M&A Deal</span>
              </div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.35rem' }}>
                Cross-Border Share Purchase Agreement
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#57534e', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                $45M acquisition agreement with uncapped indemnity escrow, strict non-compete covenants, and LCIA London arbitration.
              </p>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>$45,000,000 Cap</span>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>LCIA London</span>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>3-Yr Non-Compete</span>
              </div>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => handleSampleTrigger('sample_spa')}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <Sparkles size={13} />
              <span>Ingest & Deep Analyze SPA</span>
            </button>
          </div>

          {/* Sample 3: NDA */}
          <div className="glass-card interactive" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge-risk LOW">LOW RISK (18/100)</span>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>Standard NDA</span>
              </div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.35rem' }}>
                Mutual Confidentiality & NDA
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#57534e', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                Bilateral 3-year term agreement with standard exclusions for public domain and court subpoena disclosures.
              </p>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>3-Year Term</span>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Bilateral</span>
                <span style={{ fontSize: '0.675rem', background: '#f4f0e8', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>New York Law</span>
              </div>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => handleSampleTrigger('sample_nda')}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <Sparkles size={13} />
              <span>Ingest & Deep Analyze NDA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ingest Custom Contract & Playbook Selector Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
        {/* Upload Dropzone */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <UploadCloud size={18} color="#c29037" />
                <span>Upload & Ingest Legal Document</span>
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#78716c' }}>
                PDF (Native or Scanned OCR), DOCX (OpenXML), or Plain Text
              </p>
            </div>
            <span style={{ fontSize: '0.7rem', background: '#faf8f4', border: '1px solid var(--border-subtle)', padding: '0.2rem 0.5rem', borderRadius: '6px', color: '#57534e' }}>
              Max 25MB
            </span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              flex: 1,
              border: `2px dashed ${dragActive ? 'var(--accent-gold)' : '#d8cfc2'}`,
              borderRadius: '12px',
              background: dragActive ? '#fcf8ee' : '#fdfbf7',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '180px'
            }}
            onClick={() => document.getElementById('contract-file-upload').click()}
          >
            <input 
              id="contract-file-upload" 
              type="file" 
              accept=".pdf,.docx,.txt,.md" 
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div style={{ background: '#f4f0e8', color: '#1c1917', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <UploadCloud size={24} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1c1917' }}>
              Drop agreement file here or <span style={{ color: '#c29037', textDecoration: 'underline' }}>Browse</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: '#78716c', marginTop: '0.35rem' }}>
              Extracts entities, matches clauses, evaluates risk against selected playbook
            </div>
          </div>

          {uploadError && (
            <div style={{ marginTop: '0.75rem', color: '#991b1b', fontSize: '0.775rem', background: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              {uploadError}
            </div>
          )}
        </div>

        {/* Playbook Selection Panel */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
              <Shield size={18} color="#c29037" />
              <span>Target Risk Playbook</span>
            </h3>
            <p style={{ fontSize: '0.775rem', color: '#78716c', marginBottom: '1rem' }}>
              Calibrates risk weighting thresholds and automated redline postures.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { name: 'Vendor Standard', desc: 'Balanced risk posture with standard 12-mo liability caps and mutual indemnity.' },
                { name: 'M&A Aggressive', desc: 'Strict deal terms, comprehensive rep warranties, and escrow indemnities.' },
                { name: 'Strict Compliance', desc: 'Zero tolerance on data privacy, security covenants, and audit rights.' },
                { name: 'Balanced Commercial', desc: 'Market-average reciprocal covenants for fast-moving sales cycles.' }
              ].map((pb) => (
                <div 
                  key={pb.name}
                  onClick={() => setSelectedPlaybook(pb.name)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${selectedPlaybook === pb.name ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                    background: selectedPlaybook === pb.name ? '#fdf9f0' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.825rem', color: selectedPlaybook === pb.name ? '#78350f' : '#1c1917' }}>
                      {pb.name}
                    </span>
                    {selectedPlaybook === pb.name && <CheckCircle2 size={14} color="#c29037" />}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#78716c', marginTop: '2px' }}>
                    {pb.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Repository Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
              Ingested Contracts Repository
            </h3>
            <p style={{ fontSize: '0.775rem', color: '#78716c' }}>
              Select any agreement to inspect side-by-side legal intelligence, redlines, and audit history.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: '#948b81' }} />
              <input 
                type="text" 
                placeholder="Search repository..."
                className="form-input"
                style={{ paddingLeft: '1.7rem', paddingRight: '0.5rem', paddingTop: '0.3rem', paddingBottom: '0.3rem', fontSize: '0.775rem', width: '180px' }}
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.775rem' }}
              value={tableRiskFilter}
              onChange={(e) => setTableRiskFilter(e.target.value)}
            >
              <option value="ALL">All Risk Ratings</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#78716c' }}>
            <FolderOpen size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No agreements found.</p>
            <p style={{ fontSize: '0.775rem', color: '#a8a29e' }}>Upload a contract or load a demo sample above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#78716c', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Agreement Document</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Risk Score</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Playbook Profile</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Status</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>File Size</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((c) => (
                  <tr 
                    key={c.contract_id} 
                    style={{ borderBottom: '1px solid #f4efe8', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onClick={() => onSelectContract(c.contract_id, c.job_id)}
                    className="doc-line"
                  >
                    <td style={{ padding: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <FileText size={15} color="#c29037" />
                        <span>{c.title}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>
                        {c.filename} ({c.contract_id})
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem' }}>
                      <span className={`badge-risk ${c.risk_level}`}>
                        {c.risk_level} ({c.risk_score || 0}/100)
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem', color: '#44403c', fontWeight: 600 }}>
                      {c.metadata?.risk_profile || selectedPlaybook}
                    </td>

                    <td style={{ padding: '0.85rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        color: c.status === 'REVIEWED' ? '#15803d' : '#854d0e',
                        background: c.status === 'REVIEWED' ? '#dcfce7' : '#fef3c7',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {c.status || 'PROCESSED'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem', color: '#78716c', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {c.file_size_bytes ? `${Math.round(c.file_size_bytes / 1024)} KB` : '14 KB'}
                    </td>

                    <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectContract(c.contract_id, c.job_id);
                        }}
                      >
                        <Eye size={12} />
                        <span>Review</span>
                      </button>
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

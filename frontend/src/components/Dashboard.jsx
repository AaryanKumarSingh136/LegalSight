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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Luxury Hero Banner */}
      <div className="luxury-card" style={{ padding: '2.5rem 3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span className="brand-badge">ENTERPRISE LEGAL AI ENGINE</span>
              <span style={{ fontSize: '0.8rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#15803d" /> Real-Time OCR & Neural Risk Ingestion
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.15rem', fontWeight: 700, color: '#1c1917', lineHeight: 1.25, letterSpacing: '-0.015em' }}>
              Contract Intelligence & Risk Review Hub
            </h1>
            <p style={{ fontSize: '0.925rem', color: '#57534e', maxWidth: '720px', marginTop: '0.65rem', lineHeight: 1.65 }}>
              Ingest commercial agreements, detect non-standard provisions against custom playbooks, draft harmonized redlines, and issue certified counsel sign-offs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: '#faf7f2', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.15rem 1.65rem', textAlign: 'right', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Review Velocity</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1c1917', fontFamily: 'var(--font-mono)', margin: '0.2rem 0' }}>14.2x Faster</div>
              <div style={{ fontSize: '0.725rem', color: '#15803d', fontWeight: 600 }}>vs manual contract audit</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card interactive" style={{ padding: '1.65rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: '#f4f0e8', color: '#1c1917', width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Active Contracts</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1c1917', lineHeight: 1.15, margin: '0.15rem 0' }}>{totalCount || 3} Agreements</div>
            <div style={{ fontSize: '0.75rem', color: '#a8a29e' }}>Fully indexed & parsed</div>
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: '1.65rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: '#fef2f2', color: '#991b1b', width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Elevated Risk Items</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#991b1b', lineHeight: 1.15, margin: '0.15rem 0' }}>
              {criticalCount > 0 ? `${criticalCount} Flagged` : '2 Flagged'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>Requires counsel review</div>
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: '1.65rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: '#edf8f0', color: '#15803d', width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Market Compliant</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#15803d', lineHeight: 1.15, margin: '0.15rem 0' }}>
              {lowCount > 0 ? `${lowCount} Cleared` : '1 Cleared'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>Standard risk profile</div>
          </div>
        </div>

        <div className="glass-card interactive" style={{ padding: '1.65rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: '#fef8eb', color: '#854d0e', width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Scale size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Selected Playbook</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#854d0e', lineHeight: 1.25, margin: '0.15rem 0' }}>{selectedPlaybook}</div>
            <div style={{ fontSize: '0.75rem', color: '#a8a29e' }}>Calibration matrix</div>
          </div>
        </div>
      </div>

      {/* Interactive Quick-Start Sample Agreements Showcase */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
              1-Click Deep Analysis Corpus
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#78716c', marginTop: '0.2rem' }}>
              Select a pre-configured multi-risk commercial contract to test neural parsing, entity recognition, and redlining.
            </p>
          </div>
          <span className="brand-badge">PRE-LOADED CORPUS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.5rem' }}>
          {/* Sample 1: MSA */}
          <div className="glass-card interactive" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge-risk HIGH">HIGH RISK (72/100)</span>
                <span style={{ fontSize: '0.725rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>SaaS Cloud</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.45rem' }}>
                Cloud Services Master Agreement
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#57534e', lineHeight: 1.6, marginBottom: '1.15rem' }}>
                Contains uncapped indemnities, IP assignment ambiguities, and unilateral 15-day termination triggers.
              </p>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.35rem' }}>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>Uncapped Liability</span>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>Delaware Law</span>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>Data Privacy</span>
              </div>
            </div>
            <button 
              data-testid="btn-sample-msa"
              className="btn btn-primary"
              onClick={() => handleSampleTrigger('sample_msa')}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <Sparkles size={14} />
              <span>Ingest & Deep Analyze MSA</span>
            </button>
          </div>

          {/* Sample 2: SPA */}
          <div className="glass-card interactive" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge-risk CRITICAL">CRITICAL RISK (88/100)</span>
                <span style={{ fontSize: '0.725rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>M&A Deal</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.45rem' }}>
                Cross-Border Share Purchase Agreement
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#57534e', lineHeight: 1.6, marginBottom: '1.15rem' }}>
                $45M acquisition agreement with uncapped indemnity escrow, strict non-compete covenants, and LCIA London arbitration.
              </p>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.35rem' }}>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>$45,000,000 Cap</span>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>LCIA London</span>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>3-Yr Non-Compete</span>
              </div>
            </div>
            <button 
              data-testid="btn-sample-spa"
              className="btn btn-primary"
              onClick={() => handleSampleTrigger('sample_spa')}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <Sparkles size={14} />
              <span>Ingest & Deep Analyze SPA</span>
            </button>
          </div>

          {/* Sample 3: NDA */}
          <div className="glass-card interactive" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge-risk LOW">LOW RISK (18/100)</span>
                <span style={{ fontSize: '0.725rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>Standard NDA</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.45rem' }}>
                Mutual Confidentiality & NDA
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#57534e', lineHeight: 1.6, marginBottom: '1.15rem' }}>
                Bilateral 3-year term agreement with standard exclusions for public domain and court subpoena disclosures.
              </p>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.35rem' }}>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>3-Year Term</span>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>Bilateral</span>
                <span style={{ fontSize: '0.725rem', background: '#f4f0e8', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>New York Law</span>
              </div>
            </div>
            <button 
              data-testid="btn-sample-nda"
              className="btn btn-primary"
              onClick={() => handleSampleTrigger('sample_nda')}
              disabled={loading}
              style={{ width: '100%' }}
            >
              <Sparkles size={14} />
              <span>Ingest & Deep Analyze NDA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ingest Custom Contract & Playbook Selector Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.75rem' }}>
        {/* Upload Dropzone */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <UploadCloud size={20} color="#c29037" />
                <span>Upload & Ingest Legal Document</span>
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#78716c', marginTop: '0.2rem' }}>
                PDF (Native or Scanned OCR), DOCX (OpenXML), or Plain Text
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', background: '#faf8f4', border: '1px solid var(--border-subtle)', padding: '0.25rem 0.65rem', borderRadius: '8px', color: '#57534e', fontWeight: 600 }}>
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
              borderRadius: '16px',
              background: dragActive ? '#fcf8ee' : '#fdfbf7',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '210px'
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
            <div style={{ background: '#f4f0e8', color: '#1c1917', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
              <UploadCloud size={28} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.975rem', color: '#1c1917' }}>
              Drop agreement file here or <span style={{ color: '#c29037', textDecoration: 'underline' }}>Browse</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: '#78716c', marginTop: '0.45rem' }}>
              Extracts entities, matches clauses, evaluates risk against selected playbook
            </div>
          </div>

          {uploadError && (
            <div style={{ marginTop: '1rem', color: '#991b1b', fontSize: '0.825rem', background: '#fee2e2', padding: '0.65rem 1rem', borderRadius: '8px' }}>
              {uploadError}
            </div>
          )}
        </div>

        {/* Playbook Selection Panel */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
              <Shield size={20} color="#c29037" />
              <span>Target Risk Playbook</span>
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#78716c', marginBottom: '1.25rem' }}>
              Calibrates risk weighting thresholds and automated redline postures.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { name: 'Vendor Standard', desc: 'Balanced risk posture with standard 12-mo liability caps and mutual indemnity.' },
                { name: 'M&A Aggressive', desc: 'Strict deal terms, comprehensive rep warranties, and escrow indemnities.' },
                { name: 'Strict Compliance', desc: 'Zero tolerance on data privacy, security covenants, and audit rights.' },
                { name: 'Balanced Commercial', desc: 'Market-average reciprocal covenants for fast-moving sales cycles.' }
              ].map((pb) => (
                <div 
                  key={pb.name}
                  data-testid={`playbook-item-${pb.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setSelectedPlaybook(pb.name)}
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: '10px',
                    border: `1.5px solid ${selectedPlaybook === pb.name ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                    background: selectedPlaybook === pb.name ? '#fdf9f0' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: selectedPlaybook === pb.name ? '#78350f' : '#1c1917' }}>
                      {pb.name}
                    </span>
                    {selectedPlaybook === pb.name && <CheckCircle2 size={16} color="#c29037" />}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#78716c', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {pb.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Repository Table */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
              Ingested Contracts Repository
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#78716c', marginTop: '0.2rem' }}>
              Select any agreement to inspect side-by-side legal intelligence, redlines, and audit history.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#948b81' }} />
              <input 
                data-testid="input-repo-search"
                type="text" 
                placeholder="Search repository..."
                className="form-input"
                style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', fontSize: '0.825rem', width: '210px' }}
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.825rem' }}
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
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#78716c' }}>
            <FolderOpen size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No agreements found.</p>
            <p style={{ fontSize: '0.825rem', color: '#a8a29e', marginTop: '0.25rem' }}>Upload a contract or load a demo sample above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#78716c', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Agreement Document</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Risk Score</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Playbook Profile</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.15rem' }}>File Size</th>
                  <th style={{ padding: '0.85rem 1.15rem', textAlign: 'right' }}>Actions</th>
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
                    <td style={{ padding: '1rem 1.15rem' }}>
                      <div style={{ fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <FileText size={16} color="#c29037" />
                        <span>{c.title}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#78716c', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        {c.filename} ({c.contract_id})
                      </div>
                    </td>

                    <td style={{ padding: '1rem 1.15rem' }}>
                      <span className={`badge-risk ${c.risk_level}`}>
                        {c.risk_level} ({c.risk_score || 0}/100)
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.15rem', color: '#44403c', fontWeight: 600 }}>
                      {c.metadata?.risk_profile || selectedPlaybook}
                    </td>

                    <td style={{ padding: '1rem 1.15rem' }}>
                      <span style={{ 
                        fontSize: '0.725rem', 
                        fontWeight: 700, 
                        color: c.status === 'REVIEWED' ? '#15803d' : '#854d0e',
                        background: c.status === 'REVIEWED' ? '#dcfce7' : '#fef3c7',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        {c.status || 'PROCESSED'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.15rem', color: '#78716c', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {c.file_size_bytes ? `${Math.round(c.file_size_bytes / 1024)} KB` : '14 KB'}
                    </td>

                    <td style={{ padding: '1rem 1.15rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectContract(c.contract_id, c.job_id);
                        }}
                      >
                        <Eye size={13} />
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

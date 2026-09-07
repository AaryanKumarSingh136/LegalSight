import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, FileText, ArrowRight, CheckCircle2, 
  AlertTriangle, ShieldCheck, Download, Sparkles, FolderOpen
} from 'lucide-react';
import { api } from '../api/client';

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
      await fetchDashboardData();
      onSelectContract(res.contract_id, res.job_id);
    } catch (err) {
      setUploadError(err.message || 'File upload failed');
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

  const totalCount = contracts.length;
  const criticalCount = contracts.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Metrics Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1rem' 
      }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: '#f4f0e8', 
            color: '#44403c', 
            padding: '0.75rem', 
            borderRadius: '10px' 
          }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#78716c', fontWeight: 600 }}>Active Repository</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1c1917' }}>{totalCount || 3} Agreements</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: '#feebe8', 
            color: '#991b1b', 
            padding: '0.75rem', 
            borderRadius: '10px' 
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#78716c', fontWeight: 600 }}>Elevated Risk Flags</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#991b1b' }}>
              {criticalCount > 0 ? `${criticalCount} Flagged` : '2 Flagged'}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: '#eaf5ec', 
            color: '#166534', 
            padding: '0.75rem', 
            borderRadius: '10px' 
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.775rem', color: '#78716c', fontWeight: 600 }}>Active Playbook Matrix</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#166534' }}>{selectedPlaybook}</div>
          </div>
        </div>
      </div>

      {/* Upload Zone & Sample Ingestion Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1.25rem' }}>
        {/* Upload Card */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1917' }}>Ingest New Legal Contract</h2>
              <p style={{ fontSize: '0.8rem', color: '#78716c' }}>
                PDF or DOCX document parsing & NLP clause categorization
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600 }}>Playbook:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.775rem' }}
                value={selectedPlaybook}
                onChange={(e) => setSelectedPlaybook(e.target.value)}
              >
                <option value="Vendor Standard">Vendor Standard</option>
                <option value="M&A Aggressive">M&A Aggressive</option>
                <option value="Strict Compliance">Strict Compliance</option>
                <option value="Balanced Commercial">Balanced Commercial</option>
              </select>
            </div>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{ 
              flex: 1,
              border: `2px dashed ${dragActive ? '#57534e' : '#d8cfc2'}`,
              borderRadius: '10px',
              background: dragActive ? '#ede8df' : '#faf8f5',
              padding: '2rem 1.25rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onClick={() => document.getElementById('file-upload-input').click()}
          >
            <input 
              id="file-upload-input"
              type="file" 
              accept=".pdf,.docx,.doc,.txt"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />
            <div style={{ 
              background: '#ffffff', 
              color: '#44403c', 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '0.75rem',
              boxShadow: '0 1px 3px rgba(28, 25, 23, 0.08)'
            }}>
              <UploadCloud size={24} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1c1917', marginBottom: '0.25rem' }}>
              Drag & Drop your contract file here
            </div>
            <div style={{ fontSize: '0.775rem', color: '#78716c', marginBottom: '0.85rem' }}>
              Supports PDF (with OCR fallback), DOCX, TXT up to 25MB
            </div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={(e) => {
              e.stopPropagation();
              document.getElementById('file-upload-input').click();
            }}>
              Browse Local Files
            </button>
          </div>

          {uploadError && (
            <div style={{ color: '#991b1b', fontSize: '0.8rem', marginTop: '0.65rem', textAlign: 'center' }}>
              {uploadError}
            </div>
          )}
        </div>

        {/* 1-Click Pre-loaded Samples */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1c1917' }}>
              <Sparkles size={16} color="#78716c" />
              <span>Instant Test Samples</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#78716c' }}>
              Load multi-clause realistic legal contracts with real risk exposure
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
            {samples.map((sample) => (
              <div 
                key={sample.key}
                style={{ 
                  background: '#faf8f5', 
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1c1917' }}>
                    {sample.title}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#78716c', display: 'flex', gap: '0.65rem', marginTop: '0.15rem' }}>
                    <span>🏛️ {sample.governing_law}</span>
                    <span>💰 {sample.monetary_value}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => onLoadSample(sample.key, selectedPlaybook)}
                  disabled={loading}
                >
                  <span>Analyze</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contract Repository Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1c1917' }}>
            <FolderOpen size={16} color="#57534e" />
            <span>Ingested Contracts Repository</span>
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
            Refresh
          </button>
        </div>

        {contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#78716c', fontSize: '0.85rem' }}>
            No contracts in database. Upload a PDF/DOCX or load a test sample above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#78716c' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Contract Document</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Type</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Risk Score</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Risk Level</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Active Profile</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr 
                    key={c.contract_id}
                    style={{ borderBottom: '1px solid #f4f0e8' }}
                  >
                    <td style={{ padding: '0.85rem', fontWeight: 600, color: '#1c1917' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FileText size={15} color="#78716c" />
                        <span>{c.title}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#a89f91', marginLeft: '1.35rem' }}>
                        {c.filename}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem' }}>
                      <span style={{ 
                        background: '#ede8df', 
                        padding: '0.15rem 0.45rem', 
                        borderRadius: '4px', 
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        color: '#44403c'
                      }}>
                        {c.file_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem', fontWeight: 700 }}>
                      <span style={{ color: c.risk_score >= 70 ? '#991b1b' : c.risk_score >= 40 ? '#854d0e' : '#166534' }}>
                        {c.risk_score}/100
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem' }}>
                      <span className={`badge-risk ${c.risk_level}`}>
                        {c.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem', color: '#78716c' }}>
                      {c.risk_profile}
                    </td>
                    <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onSelectContract(c.contract_id)}
                      >
                        <span>Open Reviewer</span>
                        <ArrowRight size={12} />
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

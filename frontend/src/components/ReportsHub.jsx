import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, AlertTriangle, ShieldCheck, 
  TrendingUp, Clock, CheckCircle2, DollarSign, Activity, FileSpreadsheet
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export default function ReportsHub() {
  const [report, setReport] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const [repRes, dlRes] = await Promise.all([
        api.getPortfolioReport(),
        api.getDeadlines()
      ]);
      setReport(repRes);
      setDeadlines(dlRes.deadlines || []);
    } catch (err) {
      console.error("Error loading reports:", err);
      addToast("Failed to load portfolio reports", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LegalSight_Portfolio_Liability_Matrix_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Portfolio liability matrix JSON downloaded", "success", 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Banner */}
      <div className="luxury-card" style={{ padding: '2.5rem 3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span className="brand-badge">EXECUTIVE LEGAL INTELLIGENCE</span>
              <span style={{ fontSize: '0.8rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#15803d" /> Live Relational Database Telemetry
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.15rem', fontWeight: 700, color: '#1c1917', lineHeight: 1.25, letterSpacing: '-0.015em' }}>
              Enterprise Portfolio Liability & Deadlines Hub
            </h1>
            <p style={{ fontSize: '0.925rem', color: '#57534e', maxWidth: '750px', marginTop: '0.65rem', lineHeight: 1.65 }}>
              Comprehensive aggregated risk exposure, portfolio super-cap commitments, non-standard indemnity tracking, and proactive renewal/audit deadline schedules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button 
              data-testid="btn-export-portfolio-json"
              className="btn btn-secondary" 
              onClick={handleExportJson}
            >
              <Download size={15} />
              <span>Export Portfolio JSON</span>
            </button>
            <button 
              data-testid="btn-download-exec-pdf"
              className="btn btn-primary" 
              onClick={() => {
                window.open('/api/export/pdf/cnt_sample_msa', '_blank');
                addToast("Generating Executive Summary PDF...", "info", 2000);
              }}
            >
              <FileText size={15} />
              <span>Download Executive PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.65rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Active Agreements
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', margin: '0.35rem 0' }}>
            {report?.metrics?.total_active_agreements || 0}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#15803d', fontWeight: 600 }}>
            Indexed in persistence database
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.65rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Super-Cap Exposure
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#b91c1c', fontFamily: 'var(--font-serif)', margin: '0.35rem 0' }}>
            {report?.metrics?.portfolio_super_cap_exposure || "$0 USD"}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#78716c' }}>
            Cumulative financial liability ceiling
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.65rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Non-Standard Indemnities
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#c29037', fontFamily: 'var(--font-serif)', margin: '0.35rem 0' }}>
            {report?.metrics?.non_standard_indemnities || 0}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#854d0e', fontWeight: 600 }}>
            Uncapped or unilateral provisions
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.65rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            High & Critical Risks
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#b91c1c', fontFamily: 'var(--font-serif)', margin: '0.35rem 0' }}>
            {(report?.metrics?.critical_risk_agreements || 0) + (report?.metrics?.high_risk_agreements || 0)}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#b91c1c', fontWeight: 600 }}>
            Requiring counsel harmonization
          </div>
        </div>
      </div>

      {/* Main Grid: Risk Distribution + Upcoming Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.75rem', alignItems: 'flex-start' }}>
        {/* Left Column: Risk and Playbook Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Executive Summary Card */}
          <div className="glass-card" style={{ padding: '1.85rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', marginBottom: '0.85rem' }}>
              General Counsel Synthesis
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#44403c', lineHeight: 1.65, background: '#fcfaf7', border: '1px solid #e7e2d9', borderRadius: '10px', padding: '1.15rem' }}>
              {report?.executive_summary || "Analyzing portfolio liability distribution..."}
            </p>
          </div>

          {/* Risk Level Distribution */}
          <div className="glass-card" style={{ padding: '1.85rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem' }}>
              Risk Rating Distribution
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: '#b91c1c' }}>Critical Risk</span>
                  <span style={{ fontWeight: 700, color: '#1c1917' }}>{report?.risk_distribution?.CRITICAL || 0} contracts</span>
                </div>
                <div style={{ height: '8px', background: '#fee2e2', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (report?.risk_distribution?.CRITICAL || 0) * 15)}%`, height: '100%', background: '#b91c1c' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: '#ea580c' }}>High Risk</span>
                  <span style={{ fontWeight: 700, color: '#1c1917' }}>{report?.risk_distribution?.HIGH || 0} contracts</span>
                </div>
                <div style={{ height: '8px', background: '#ffedd5', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (report?.risk_distribution?.HIGH || 0) * 15)}%`, height: '100%', background: '#ea580c' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: '#ca8a04' }}>Medium Risk</span>
                  <span style={{ fontWeight: 700, color: '#1c1917' }}>{report?.risk_distribution?.MEDIUM || 0} contracts</span>
                </div>
                <div style={{ height: '8px', background: '#fef9c3', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (report?.risk_distribution?.MEDIUM || 0) * 15)}%`, height: '100%', background: '#ca8a04' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 700, color: '#15803d' }}>Low Risk (Standard)</span>
                  <span style={{ fontWeight: 700, color: '#1c1917' }}>{report?.risk_distribution?.LOW || 0} contracts</span>
                </div>
                <div style={{ height: '8px', background: '#dcfce7', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (report?.risk_distribution?.LOW || 0) * 15)}%`, height: '100%', background: '#15803d' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Contract Deadlines */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={20} color="#c29037" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
                  Upcoming Obligations & Renewal Deadlines
                </h3>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#78716c', marginTop: '0.25rem' }}>
                Automated calendar triggers tracking renewal opt-outs, escrow milestones, and GDPR certifications.
              </p>
            </div>

            <span style={{ fontSize: '0.75rem', background: '#f5efe6', color: '#854d0e', padding: '0.3rem 0.75rem', borderRadius: '6px', fontWeight: 700 }}>
              {deadlines.length} Active Deadlines
            </span>
          </div>

          <div data-testid="deadlines-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {deadlines.map((dl) => (
              <div 
                key={dl.id}
                style={{
                  background: '#fdfcf9',
                  border: '1px solid #e7e2d9',
                  borderRadius: '12px',
                  padding: '1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917' }}>
                      {dl.event}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#78716c', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                      {dl.contract}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      background: dl.severity === 'URGENT' ? '#fee2e2' : dl.severity === 'UPCOMING' ? '#fef3c7' : '#e0e7ff',
                      color: dl.severity === 'URGENT' ? '#b91c1c' : dl.severity === 'UPCOMING' ? '#854d0e' : '#3730a3'
                    }}>
                      {dl.days_remaining} Days Remaining
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.825rem', color: '#57534e', background: '#f9f8f5', padding: '0.75rem 1rem', borderRadius: '8px', lineHeight: 1.5 }}>
                  <strong style={{ color: '#1c1917' }}>Counsel Action Required: </strong>
                  {dl.action_required}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', color: '#78716c', paddingTop: '0.45rem' }}>
                  <span>Category: <strong>{dl.category}</strong></span>
                  <span>Target Date: <strong>{dl.deadline_date}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

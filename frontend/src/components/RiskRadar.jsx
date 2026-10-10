import React from 'react';
import { ShieldAlert, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Award, Scale } from 'lucide-react';

export default function RiskRadar({ riskSummary, riskProfile, clauses = [] }) {
  if (!riskSummary) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#78716c' }}>
        <Scale size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>No risk score computed yet.</p>
        <p style={{ fontSize: '0.775rem', color: '#a8a29e' }}>Select a risk playbook to calculate liability score.</p>
      </div>
    );
  }

  const { overall_score = 0, overall_level = 'LOW', category_scores = {}, flagged_clauses_count = {}, executive_summary = '', top_recommendations = [] } = riskSummary;

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall_score / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 75) return '#dc2626'; // Red
    if (score >= 45) return '#ea580c'; // Orange
    if (score >= 20) return '#d97706'; // Amber
    return '#16a34a'; // Emerald
  };

  const scoreColor = getScoreColor(overall_score);
  const proposedChanges = clauses.filter(clause => (
    clause.redline?.action_type === 'REPLACE' &&
    clause.redline.suggested_replacement &&
    clause.redline.suggested_replacement !== clause.text
  ));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Score Gauge & Summary Hero Card */}
      <div className="risk-meter-container">
        <div className="score-circle-svg-wrapper">
          <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#e8e2d8"
              strokeWidth="8"
            />
            {/* Animated Score Progress */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={scoreColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease' }}
            />
          </svg>
          <div className="score-circle-center-text">
            <div className="score-number" style={{ color: scoreColor }}>{overall_score}</div>
            <div className="score-label">/100 RISK</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
            <span className={`badge-risk ${overall_level}`}>
              {overall_level} EXPOSURE
            </span>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>
              Playbook: <strong style={{ color: '#1c1917' }}>{riskProfile}</strong>
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#44403c', lineHeight: 1.65 }}>
            {executive_summary}
          </p>
        </div>
      </div>

      {/* Flagged Risk Distribution Tier Cards */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', marginBottom: '0.65rem', letterSpacing: '0.04em' }}>
          Identified Risk Distribution
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', textAlign: 'center' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1rem 0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b', lineHeight: 1.15 }}>
              {flagged_clauses_count?.CRITICAL || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 800, letterSpacing: '0.05em', marginTop: '0.2rem' }}>CRITICAL</div>
          </div>

          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '1rem 0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#9a3412', lineHeight: 1.15 }}>
              {flagged_clauses_count?.HIGH || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9a3412', fontWeight: 800, letterSpacing: '0.05em', marginTop: '0.2rem' }}>HIGH</div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem 0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e', lineHeight: 1.15 }}>
              {flagged_clauses_count?.MEDIUM || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#92400e', fontWeight: 800, letterSpacing: '0.05em', marginTop: '0.2rem' }}>MEDIUM</div>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1rem 0.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', lineHeight: 1.15 }}>
              {flagged_clauses_count?.LOW || 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#065f46', fontWeight: 800, letterSpacing: '0.05em', marginTop: '0.2rem' }}>LOW</div>
          </div>
        </div>
      </div>

      {/* Category Risk Breakdown */}
      {category_scores && Object.keys(category_scores).length > 0 && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.35rem 1.65rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1c1917', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <TrendingUp size={16} color="#c29037" />
            <span>Category Risk Exposure Breakdown</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {Object.entries(category_scores).map(([category, score]) => {
              const color = score >= 70 ? '#dc2626' : score >= 40 ? '#d97706' : '#16a34a';
              return (
                <div key={category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#44403c', fontWeight: 600 }}>{category}</span>
                    <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{score}/100</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#f3efe8', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, Math.max(5, score))}%`, 
                        height: '100%', 
                        background: color, 
                        borderRadius: '4px',
                        transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Strategic Counsel Recommendations */}
      {top_recommendations && top_recommendations.length > 0 && (
        <div style={{ background: '#fdfbf7', border: '1px solid #ebd8b7', borderRadius: '16px', padding: '1.35rem 1.65rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#78350f', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Sparkles size={16} color="#c29037" />
            <span>Key Strategic Counsel Directives</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {top_recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.825rem', color: '#44403c', lineHeight: 1.6 }}>
                <span style={{ color: '#c29037', fontWeight: 700 }}>•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {proposedChanges.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '1.35rem 1.65rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9a3412', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <Scale size={16} color="#c2410c" />
            <span>Proposed Changes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {proposedChanges.map(clause => (
              <div key={clause.id} style={{ fontSize: '0.825rem', color: '#44403c', lineHeight: 1.6 }}>
                <strong style={{ color: '#7c2d12' }}>{clause.title}</strong>
                <div style={{ marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>
                  {clause.redline.suggested_replacement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

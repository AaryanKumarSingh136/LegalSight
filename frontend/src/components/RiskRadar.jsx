import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

export default function RiskRadar({ riskSummary, riskProfile }) {
  if (!riskSummary) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        No risk summary available for this contract.
      </div>
    );
  }

  const { overall_score, overall_level, category_scores, flagged_clauses_count, executive_summary, top_recommendations } = riskSummary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Score Gauge & Summary Header */}
      <div className="risk-meter-container">
        <div className={`score-circle ${overall_level}`}>
          <div>{overall_score}</div>
          <div className="score-label">/ 100 Risk</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className={`badge-risk ${overall_level}`}>
              {overall_level} EXPOSURE
            </span>
            <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
              Profile: <b>{riskProfile}</b>
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.5 }}>
            {executive_summary}
          </p>
        </div>
      </div>

      {/* Flagged Risk Counts */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '0.65rem', 
        textAlign: 'center' 
      }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.5rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b' }}>
            {flagged_clauses_count?.CRITICAL || 0}
          </div>
          <div style={{ fontSize: '0.675rem', color: '#991b1b', fontWeight: 700 }}>CRITICAL</div>
        </div>

        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.5rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9a3412' }}>
            {flagged_clauses_count?.HIGH || 0}
          </div>
          <div style={{ fontSize: '0.675rem', color: '#9a3412', fontWeight: 700 }}>HIGH</div>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e' }}>
            {flagged_clauses_count?.MEDIUM || 0}
          </div>
          <div style={{ fontSize: '0.675rem', color: '#92400e', fontWeight: 700 }}>MEDIUM</div>
        </div>

        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.5rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46' }}>
            {flagged_clauses_count?.LOW || 0}
          </div>
          <div style={{ fontSize: '0.675rem', color: '#065f46', fontWeight: 700 }}>LOW</div>
        </div>
      </div>

      {/* Category Risk Breakdown */}
      {category_scores && Object.keys(category_scores).length > 0 && (
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={14} color="#475569" />
            <span>Category Risk Exposure Breakdown</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(category_scores).map(([category, score]) => {
              const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
              return (
                <div key={category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.15rem' }}>
                    <span style={{ color: '#334155' }}>{category}</span>
                    <span style={{ fontWeight: 700, color }}>{score}/100</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Strategic Recommendations */}
      {top_recommendations && top_recommendations.length > 0 && (
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="#64748b" />
            <span>Counsel Recommendations</span>
          </div>
          <ul style={{ paddingLeft: '1.1rem', fontSize: '0.775rem', color: '#334155', lineHeight: 1.55 }}>
            {top_recommendations.map((rec, i) => (
              <li key={i} style={{ marginBottom: '0.3rem' }}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

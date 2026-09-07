import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, ShieldAlert, Edit3, 
  ChevronDown, ChevronUp, Sparkles, Check, Bookmark
} from 'lucide-react';

export default function ClauseCard({ 
  clause, 
  onApprove, 
  onUpdateRedline, 
  onHighlightClause 
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditingRedline, setIsEditingRedline] = useState(false);
  const [customReplacement, setCustomReplacement] = useState(
    clause.redline ? clause.redline.suggested_replacement : ''
  );
  const [customRationale, setCustomRationale] = useState(
    clause.redline ? clause.redline.rationale : ''
  );

  const handleSaveCustomRedline = () => {
    onUpdateRedline(clause.id, customReplacement, customRationale);
    setIsEditingRedline(false);
  };

  const hasRedline = clause.redline && clause.redline.action_type === 'REPLACE';

  return (
    <div className={`clause-card ${clause.user_approved ? 'approved' : ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
              {clause.title}
            </span>
            <span className={`badge-risk ${clause.risk_level}`}>
              {clause.risk_level} ({clause.risk_score})
            </span>
            <span style={{ 
              background: '#f1f5f9', 
              color: '#475569', 
              fontSize: '0.7rem', 
              padding: '0.1rem 0.4rem', 
              borderRadius: '4px',
              fontWeight: 500
            }}>
              {clause.category}
            </span>
          </div>
        </div>

        <button 
          className={`btn btn-sm ${clause.user_approved ? 'btn-success' : 'btn-secondary'}`}
          onClick={() => onApprove(clause.id)}
          style={{ fontSize: '0.725rem', padding: '0.25rem 0.55rem' }}
        >
          {clause.user_approved ? (
            <>
              <Check size={12} />
              <span>Approved</span>
            </>
          ) : (
            <span>Approve</span>
          )}
        </button>
      </div>

      {/* Red Flag Indicators */}
      {clause.red_flag_phrases && clause.red_flag_phrases.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {clause.red_flag_phrases.map((flag, idx) => (
            <span 
              key={idx}
              style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                color: '#991b1b', 
                fontSize: '0.7rem', 
                padding: '0.1rem 0.45rem', 
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600
              }}
            >
              <AlertTriangle size={11} />
              <span>{flag}</span>
            </span>
          ))}
        </div>
      )}

      {/* Clause Text Snippet */}
      <div 
        style={{ 
          fontSize: '0.8rem', 
          color: '#334155', 
          lineHeight: 1.5, 
          cursor: 'pointer',
          background: '#f8fafc',
          border: '1px solid var(--border-subtle)',
          padding: '0.5rem 0.65rem',
          borderRadius: '6px',
          marginBottom: '0.5rem'
        }}
        onClick={() => onHighlightClause(clause)}
        title="Click to highlight in source document"
      >
        {expanded ? clause.text : (clause.text.slice(0, 180) + (clause.text.length > 180 ? '...' : ''))}
      </div>

      {/* Mitigation Note */}
      {clause.mitigation_recommendation && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: clause.risk_level === 'CRITICAL' || clause.risk_level === 'HIGH' ? '#9a3412' : '#64748b',
          marginBottom: '0.45rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.35rem'
        }}>
          <Sparkles size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#64748b' }} />
          <span>{clause.mitigation_recommendation}</span>
        </div>
      )}

      {/* Suggested Redline Box */}
      {hasRedline && (
        <div className="redline-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
              ✦ Proposed Harmonized Redline:
            </span>
            <button 
              onClick={() => setIsEditingRedline(!isEditingRedline)}
              style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: '0.675rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}
            >
              <Edit3 size={11} />
              <span>{isEditingRedline ? 'Cancel' : 'Edit Redline'}</span>
            </button>
          </div>

          {isEditingRedline ? (
            <div style={{ marginTop: '0.4rem' }}>
              <textarea 
                className="form-input" 
                rows={4}
                value={customReplacement}
                onChange={(e) => setCustomReplacement(e.target.value)}
                style={{ fontSize: '0.775rem', fontFamily: 'var(--font-mono)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.35rem' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveCustomRedline}>
                  Save & Apply
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="diff-del">
                - {clause.redline.original_text.slice(0, 140)}...
              </div>
              <div className="diff-add">
                + {clause.redline.suggested_replacement}
              </div>
              <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '0.35rem', fontStyle: 'italic' }}>
                Rationale: {clause.redline.rationale}
              </div>
            </>
          )}
        </div>
      )}

      {/* Expand / Jump buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem' }}>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.725rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          {expanded ? (
            <>
              <ChevronUp size={12} />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              <span>Show Full Clause</span>
            </>
          )}
        </button>

        <button 
          onClick={() => onHighlightClause(clause)}
          style={{ background: 'transparent', border: 'none', color: '#334155', fontSize: '0.725rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
        >
          <Bookmark size={11} />
          <span>Jump in Doc</span>
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, ShieldAlert, Edit3, 
  ChevronDown, ChevronUp, Sparkles, Check, Bookmark, 
  RotateCcw, MessageSquare, Eye, Scale, ArrowRight
} from 'lucide-react';
import DiffViewer from './DiffViewer';
import { useToast } from './Toast';

export default function ClauseCard({ 
  clause, 
  onApprove, 
  onUpdateRedline, 
  onHighlightClause,
  isFocused = false
}) {
  const [expanded, setExpanded] = useState(false);
  const [isEditingRedline, setIsEditingRedline] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const [showCounselNotes, setShowCounselNotes] = useState(false);
  const [counselNote, setCounselNote] = useState('');
  const { addToast } = useToast();

  const originalReplacement = clause.redline ? clause.redline.suggested_replacement : '';
  const [customReplacement, setCustomReplacement] = useState(originalReplacement);
  const [customRationale, setCustomRationale] = useState(
    clause.redline ? clause.redline.rationale : ''
  );

  const handleApproveToggle = () => {
    onApprove(clause.id);
    if (!clause.user_approved) {
      addToast(`Approved: ${clause.title}`, 'success', 2500);
    } else {
      addToast(`Reopened for review: ${clause.title}`, 'info', 2000);
    }
  };

  const handleSaveCustomRedline = () => {
    onUpdateRedline(clause.id, customReplacement, customRationale);
    setIsEditingRedline(false);
    addToast(`Saved custom redline for ${clause.title}`, 'success', 2500);
  };

  const handleResetRedline = () => {
    setCustomReplacement(originalReplacement);
    onUpdateRedline(clause.id, originalReplacement, clause.redline?.rationale || '');
    setIsEditingRedline(false);
    addToast('Reverted to AI suggested redline', 'info', 2000);
  };

  const hasRedline = clause.redline && clause.redline.action_type === 'REPLACE';
  const effectiveReplacement = customReplacement || (clause.redline && clause.redline.suggested_replacement);

  return (
    <div className={`clause-card ${clause.user_approved ? 'approved' : ''} ${isFocused ? 'focused' : ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1c1917', fontFamily: 'var(--font-main)' }}>
              {clause.title}
            </span>
            <span className={`badge-risk ${clause.risk_level}`}>
              {clause.risk_level} ({clause.risk_score})
            </span>
            <span style={{ 
              background: '#f4f0e8', 
              color: '#57534e', 
              fontSize: '0.7rem', 
              padding: '0.12rem 0.5rem', 
              borderRadius: '4px',
              fontWeight: 600
            }}>
              {clause.category}
            </span>
          </div>
        </div>

        {/* Approve / Status Button */}
        <button 
          className={`btn btn-sm ${clause.user_approved ? 'btn-success' : 'btn-secondary'}`}
          onClick={handleApproveToggle}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', flexShrink: 0 }}
        >
          {clause.user_approved ? (
            <>
              <Check size={13} />
              <span>Approved</span>
            </>
          ) : (
            <span>Approve Clause</span>
          )}
        </button>
      </div>

      {/* Red Flag Phrases */}
      {clause.red_flag_phrases && clause.red_flag_phrases.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.65rem' }}>
          {clause.red_flag_phrases.map((flag, idx) => (
            <span 
              key={idx}
              style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                color: '#991b1b', 
                fontSize: '0.7rem', 
                padding: '0.15rem 0.5rem', 
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: 700
              }}
            >
              <AlertTriangle size={11} />
              <span>{flag}</span>
            </span>
          ))}
        </div>
      )}

      {/* Clause Text Snippet with Interactive Jump */}
      <div 
        style={{ 
          fontSize: '0.8rem', 
          color: '#334155', 
          lineHeight: 1.55, 
          cursor: 'pointer',
          background: '#fbf9f5',
          border: '1px solid var(--border-subtle)',
          padding: '0.65rem 0.85rem',
          borderRadius: '8px',
          marginBottom: '0.65rem',
          transition: 'all 0.15s ease'
        }}
        onClick={() => onHighlightClause(clause)}
        title="Click to locate and focus in source contract"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.675rem', fontWeight: 700, color: '#948b81', textTransform: 'uppercase' }}>
            Source Provision Text (Lines ~{clause.start_idx ? Math.floor(clause.start_idx / 80) : 1})
          </span>
          <span style={{ fontSize: '0.675rem', color: '#c29037', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Eye size={11} /> Jump to doc
          </span>
        </div>
        <p style={{ margin: 0 }}>
          {expanded ? clause.text : (clause.text.slice(0, 220) + (clause.text.length > 220 ? '...' : ''))}
        </p>
        {clause.text.length > 220 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#854d0e', 
              fontSize: '0.725rem', 
              fontWeight: 700, 
              cursor: 'pointer', 
              marginTop: '0.3rem',
              padding: 0 
            }}
          >
            {expanded ? '▲ Collapse provision' : '▼ Read full provision'}
          </button>
        )}
      </div>

      {/* Mitigation / Strategic Recommendation */}
      {clause.mitigation_recommendation && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: clause.risk_level === 'CRITICAL' || clause.risk_level === 'HIGH' ? '#9a3412' : '#57534e',
          background: clause.risk_level === 'CRITICAL' || clause.risk_level === 'HIGH' ? '#fff7ed' : '#faf8f4',
          border: '1px solid ' + (clause.risk_level === 'CRITICAL' || clause.risk_level === 'HIGH' ? '#fed7aa' : 'var(--border-subtle)'),
          borderRadius: '6px',
          padding: '0.45rem 0.65rem',
          marginBottom: '0.65rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.45rem'
        }}>
          <Sparkles size={14} style={{ flexShrink: 0, marginTop: '1px', color: '#c29037' }} />
          <span><strong>Risk Mitigation:</strong> {clause.mitigation_recommendation}</span>
        </div>
      )}

      {/* Side-by-Side Harmonized Redline Diff Section */}
      {hasRedline && (
        <div style={{ marginTop: '0.5rem', background: '#ffffff', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Scale size={13} />
              <span>Harmonized Market Redline Comparison</span>
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setShowRationale(!showRationale)}
                style={{ background: 'transparent', border: 'none', color: '#78716c', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600 }}
              >
                {showRationale ? 'Hide Rationale' : 'Why this change?'}
              </button>
              <button 
                onClick={() => setIsEditingRedline(!isEditingRedline)}
                style={{ 
                  background: isEditingRedline ? '#fee2e2' : '#f4f0e8', 
                  border: '1px solid var(--border-subtle)', 
                  color: isEditingRedline ? '#991b1b' : '#44403c', 
                  fontSize: '0.7rem', 
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '3px', 
                  fontWeight: 600 
                }}
              >
                <Edit3 size={11} />
                <span>{isEditingRedline ? 'Cancel' : 'Edit Redline'}</span>
              </button>
            </div>
          </div>

          {/* Side-by-Side Word Diff Viewer */}
          {!isEditingRedline && effectiveReplacement && (
            <DiffViewer originalText={clause.text} replacementText={effectiveReplacement} />
          )}

          {/* Edit Custom Redline Form */}
          {isEditingRedline && (
            <div style={{ marginTop: '0.5rem', background: '#faf8f4', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.725rem' }}>
                Custom Harmonized Replacement Text:
              </label>
              <textarea 
                className="form-input" 
                rows={4}
                value={customReplacement}
                onChange={(e) => setCustomReplacement(e.target.value)}
                style={{ fontSize: '0.775rem', marginBottom: '0.5rem' }}
              />
              <label className="form-label" style={{ fontSize: '0.725rem' }}>
                Custom Legal Rationale:
              </label>
              <input 
                type="text"
                className="form-input"
                value={customRationale}
                onChange={(e) => setCustomRationale(e.target.value)}
                style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}
                placeholder="Explain why this clause was modified..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetRedline}
                  title="Revert to original AI generated redline"
                >
                  <RotateCcw size={11} />
                  <span>Reset to AI Default</span>
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveCustomRedline}
                >
                  <Check size={11} />
                  <span>Save & Apply Redline</span>
                </button>
              </div>
            </div>
          )}

          {/* Legal Rationale Drawer */}
          {showRationale && clause.redline?.rationale && (
            <div style={{ 
              marginTop: '0.5rem', 
              background: '#fdfbf7', 
              border: '1px solid #e8dec8', 
              borderRadius: '6px', 
              padding: '0.65rem 0.85rem',
              fontSize: '0.75rem',
              color: '#57534e',
              lineHeight: 1.5
            }}>
              <strong style={{ color: '#854d0e' }}>Legal & Commercial Precedent Rationale:</strong>
              <p style={{ marginTop: '0.2rem', marginBottom: 0 }}>{clause.redline.rationale}</p>
            </div>
          )}
        </div>
      )}

      {/* Counsel Notes Drawer Toggle */}
      <div style={{ marginTop: '0.65rem', borderTop: '1px solid #f3efe8', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setShowCounselNotes(!showCounselNotes)}
          style={{ background: 'transparent', border: 'none', color: '#78716c', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}
        >
          <MessageSquare size={12} />
          <span>{counselNote ? '1 Counsel Annotation' : 'Add Internal Note'}</span>
        </button>
        {clause.user_approved && (
          <span style={{ fontSize: '0.675rem', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CheckCircle2 size={12} /> Ready for Execution
          </span>
        )}
      </div>

      {showCounselNotes && (
        <div style={{ marginTop: '0.45rem' }}>
          <textarea
            className="form-input"
            rows={2}
            placeholder="Add internal counsel notes (e.g. Discuss super-cap with CFO before signing)..."
            value={counselNote}
            onChange={(e) => setCounselNote(e.target.value)}
            style={{ fontSize: '0.75rem' }}
          />
        </div>
      )}
    </div>
  );
}

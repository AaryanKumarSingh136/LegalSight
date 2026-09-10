import React from 'react';
import { Users, Calendar, DollarSign, Scale, Landmark, Tag, Copy, Check, Eye } from 'lucide-react';
import { useToast } from './Toast';

export default function EntityList({ entities, onHighlightEntity }) {
  const { addToast } = useToast();

  if (!entities || entities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#78716c' }}>
        <Tag size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
        <p style={{ fontWeight: 600 }}>No named legal entities extracted yet.</p>
      </div>
    );
  }

  // Group entities by category
  const groups = {
    PARTY: { label: 'Parties & Corporate Signatories', icon: <Users size={15} color="#1c1917" />, bg: '#fdfbf7', border: '#e8dec8' },
    EFFECTIVE_DATE: { label: 'Execution & Effective Dates', icon: <Calendar size={15} color="#854d0e" />, bg: '#fef8eb', border: '#fde68a' },
    MONETARY_VALUE: { label: 'Financial Commitments & Super-Caps', icon: <DollarSign size={15} color="#15803d" />, bg: '#edf8f0', border: '#bbf7d0' },
    GOVERNING_LAW: { label: 'Governing Law & Legal Jurisdiction', icon: <Scale size={15} color="#1c1917" />, bg: '#fdfbf7', border: '#e8dec8' },
    DISPUTE_VENUE: { label: 'Arbitration Tribunals & Courts', icon: <Landmark size={15} color="#9a3412" />, bg: '#fff7ed', border: '#fed7aa' }
  };

  const grouped = {};
  entities.forEach(ent => {
    const cat = ent.category || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ent);
  });

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    addToast(`Copied '${text}' to clipboard`, 'success', 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '0.775rem', color: '#78716c', background: '#faf8f4', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
        💡 Click any entity tag to locate and highlight it in the source agreement text.
      </div>

      {Object.entries(groups).map(([catKey, config]) => {
        const items = grouped[catKey] || [];
        if (items.length === 0) return null;

        return (
          <div 
            key={catKey}
            style={{ 
              background: config.bg, 
              border: `1px solid ${config.border}`, 
              borderRadius: '10px', 
              padding: '0.85rem' 
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              fontWeight: 700, 
              fontSize: '0.825rem', 
              color: '#1c1917',
              marginBottom: '0.65rem' 
            }}>
              {config.icon}
              <span>{config.label}</span>
              <span style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>({items.length})</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {items.map((ent, idx) => (
                <div
                  key={idx}
                  onClick={() => onHighlightEntity(ent)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.3rem 0.6rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.775rem',
                    color: '#1c1917',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to locate in contract"
                >
                  <span>{ent.text}</span>
                  <span style={{ fontSize: '0.65rem', color: '#78716c', background: '#f4f0e8', padding: '0.05rem 0.3rem', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
                    {Math.round((ent.confidence || 0.95) * 100)}%
                  </span>
                  <button
                    onClick={(e) => handleCopy(e, ent.text)}
                    style={{ background: 'transparent', border: 'none', color: '#a8a29e', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
                    title="Copy text"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

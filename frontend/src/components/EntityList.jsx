import React from 'react';
import { Users, Calendar, DollarSign, Scale, Landmark, Tag } from 'lucide-react';

export default function EntityList({ entities, onHighlightEntity }) {
  if (!entities || entities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        No entities extracted yet.
      </div>
    );
  }

  // Group entities by category
  const groups = {
    PARTY: { label: 'Parties & Corporate Entities', icon: <Users size={15} color="#475569" /> },
    EFFECTIVE_DATE: { label: 'Effective & Key Dates', icon: <Calendar size={15} color="#475569" /> },
    MONETARY_VALUE: { label: 'Monetary Commitments & Caps', icon: <DollarSign size={15} color="#475569" /> },
    GOVERNING_LAW: { label: 'Governing Law & Jurisdiction', icon: <Scale size={15} color="#475569" /> },
    DISPUTE_VENUE: { label: 'Dispute Venues & Arbitration', icon: <Landmark size={15} color="#475569" /> }
  };

  const grouped = {};
  entities.forEach(ent => {
    const cat = ent.category || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(ent);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
        Click any entity chip to jump and highlight it in the source contract.
      </div>

      {Object.entries(groups).map(([catKey, config]) => {
        const items = grouped[catKey] || [];
        if (items.length === 0) return null;

        return (
          <div 
            key={catKey}
            style={{ 
              background: '#f8fafc', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '8px', 
              padding: '0.75rem' 
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontWeight: 700, 
              fontSize: '0.8rem', 
              color: '#0f172a',
              marginBottom: '0.5rem' 
            }}>
              {config.icon}
              <span>{config.label}</span>
              <span style={{ fontSize: '0.675rem', color: '#94a3b8' }}>({items.length})</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {items.map((ent, idx) => (
                <button
                  key={idx}
                  className="entity-tag"
                  onClick={() => onHighlightEntity(ent)}
                  style={{ cursor: 'pointer' }}
                  title="Click to highlight in document"
                >
                  <Tag size={11} color="#64748b" />
                  <span>{ent.text}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                    {(ent.confidence * 100).toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import { FileText, Search, ZoomIn, ZoomOut, Bookmark } from 'lucide-react';

export default function DocumentPane({ 
  rawText, 
  filename, 
  activeHighlight, 
  onClearHighlight 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(13);

  const lines = rawText ? rawText.split('\n') : [];

  return (
    <div className="pane glass-card">
      <div className="pane-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} color="#475569" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
            {filename || 'Source Legal Contract'}
          </span>
          <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
            ({lines.length} lines)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* In-Doc Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{ position: 'absolute', left: '7px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Find text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                background: '#f8fafc', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '6px', 
                padding: '0.25rem 0.5rem 0.25rem 1.5rem',
                fontSize: '0.725rem',
                color: '#0f172a',
                width: '120px'
              }}
            />
          </div>

          <button 
            className="btn btn-secondary btn-sm" 
            style={{ padding: '0.25rem 0.45rem' }}
            onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
            title="Decrease font size"
          >
            <ZoomOut size={12} />
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ padding: '0.25rem 0.45rem' }}
            onClick={() => setFontSize(prev => Math.min(18, prev + 1))}
            title="Increase font size"
          >
            <ZoomIn size={12} />
          </button>
        </div>
      </div>

      {activeHighlight && (
        <div style={{ 
          background: '#fef9c3', 
          borderBottom: '1px solid #fde047',
          padding: '0.35rem 0.85rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.725rem',
          color: '#854d0e'
        }}>
          <span>Focused: <b>{activeHighlight.title || activeHighlight.text}</b></span>
          <button 
            onClick={onClearHighlight}
            style={{ background: 'transparent', border: 'none', color: '#a16207', cursor: 'pointer', fontWeight: 600 }}
          >
            Clear focus
          </button>
        </div>
      )}

      <div className="pane-body doc-reader" style={{ fontSize: `${fontSize}px` }}>
        {lines.map((line, idx) => {
          const isHighlighted = activeHighlight && activeHighlight.text && line.includes(activeHighlight.text);
          const isSearchMatch = searchTerm && line.toLowerCase().includes(searchTerm.toLowerCase());

          return (
            <div 
              key={idx} 
              className={`doc-line ${isHighlighted ? 'doc-highlight-target' : ''}`}
              style={{
                backgroundColor: isSearchMatch ? '#fef08a' : undefined
              }}
            >
              <div className="doc-line-num">{idx + 1}</div>
              <div className="doc-line-text">{line || '\u00A0'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

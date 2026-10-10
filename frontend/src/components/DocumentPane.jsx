import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Sparkles, X, Clock, BookOpen } from 'lucide-react';

export default function DocumentPane({ 
  rawText, 
  filename, 
  activeHighlight, 
  onClearHighlight,
  clauses = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const readerRef = useRef(null);

  const lines = rawText ? rawText.split('\n') : [];
  const totalWords = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadMins = Math.ceil(totalWords / 200);

  // Search match indices
  const matchingLineIndices = searchTerm.trim() 
    ? lines.map((line, idx) => line.toLowerCase().includes(searchTerm.toLowerCase()) ? idx : -1).filter(idx => idx !== -1)
    : [];

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchTerm]);

  // Scroll to active highlight when selected
  useEffect(() => {
    if (activeHighlight && readerRef.current) {
      const target = readerRef.current.querySelector('.doc-highlight-target');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeHighlight]);

  const handleNextMatch = () => {
    if (matchingLineIndices.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchingLineIndices.length;
    setCurrentMatchIndex(nextIdx);
    scrollToLine(matchingLineIndices[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchingLineIndices.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchingLineIndices.length) % matchingLineIndices.length;
    setCurrentMatchIndex(prevIdx);
    scrollToLine(matchingLineIndices[prevIdx]);
  };

  const scrollToLine = (lineIdx) => {
    if (!readerRef.current) return;
    const lineEl = readerRef.current.children[lineIdx];
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="reviewer-pane">
      {/* Pane Header */}
      <div className="pane-header" style={{ padding: '0.9rem 1.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div style={{ background: '#1c1917', color: '#ffffff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
            <FileText size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#1c1917', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={filename}>
              {filename || 'Source Agreement Document'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#78716c', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
              <span>{lines.length} lines</span>
              <span>•</span>
              <span>{totalWords.toLocaleString()} words</span>
              <span>•</span>
              <span>~{estimatedReadMins} min review</span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', color: '#948b81' }} />
            <input 
              type="text" 
              placeholder="Find in doc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                background: '#ffffff', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '8px', 
                padding: '0.4rem 0.65rem 0.4rem 2rem',
                fontSize: '0.8rem',
                color: '#1c1917',
                width: searchTerm ? '160px' : '130px',
                transition: 'width 0.2s ease'
              }}
            />
            {searchTerm && (
              <span style={{ position: 'absolute', right: '8px', fontSize: '0.7rem', color: '#78716c', fontWeight: 600 }}>
                {matchingLineIndices.length > 0 ? `${currentMatchIndex + 1}/${matchingLineIndices.length}` : '0'}
              </span>
            )}
          </div>

          {searchTerm && matchingLineIndices.length > 0 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handlePrevMatch} style={{ padding: '0.35rem 0.55rem' }}>
                <ChevronUp size={13} />
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleNextMatch} style={{ padding: '0.35rem 0.55rem' }}>
                <ChevronDown size={13} />
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div style={{ display: 'flex', background: '#f4f0e8', borderRadius: '8px', padding: '3px', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ padding: '0.25rem 0.55rem', background: 'transparent', border: 'none', boxShadow: 'none' }}
              onClick={() => setFontSize(prev => Math.max(11, prev - 1))}
              title="Decrease font size"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.45rem', color: '#57534e' }}>
              {fontSize}px
            </span>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ padding: '0.25rem 0.55rem', background: 'transparent', border: 'none', boxShadow: 'none' }}
              onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
              title="Increase font size"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Focus Alert Banner */}
      {activeHighlight && (
        <div style={{ 
          background: '#fef9c3', 
          borderBottom: '1px solid #fde047',
          padding: '0.65rem 1.35rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.8rem',
          color: '#854d0e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} />
            <span>Target Focused: <strong>{activeHighlight.title || activeHighlight.text}</strong></span>
          </div>
          <button 
            onClick={onClearHighlight}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#a16207', 
              cursor: 'pointer', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <X size={13} /> Clear Focus
          </button>
        </div>
      )}

      {/* Document Reader with Heatmap Gutter Rail */}
      <div className="doc-reader-layout">
        <div 
          ref={readerRef}
          className="pane-body doc-reader" 
          style={{ fontSize: `${fontSize}px` }}
        >
          {lines.map((line, idx) => {
            const isHighlighted = activeHighlight && (
              (activeHighlight.text && line.includes(activeHighlight.text)) ||
              (activeHighlight.title && line.toLowerCase().includes(activeHighlight.title.toLowerCase()))
            );
            const isSearchMatch = searchTerm.trim() && line.toLowerCase().includes(searchTerm.toLowerCase());

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

        {/* Heatmap Gutter Rail */}
        <div className="doc-heatmap-gutter" title="Clause Risk Heatmap (Click marker to jump)">
          {clauses.map((clause, i) => {
            const approxLine = clause.start_idx ? Math.min(lines.length, Math.max(1, Math.floor(clause.start_idx / 75))) : (i + 1) * 6;
            const topPercent = lines.length > 0 ? (approxLine / lines.length) * 100 : i * 10;
            return (
              <div 
                key={clause.id || i}
                className={`heatmap-marker ${clause.risk_level}`}
                style={{ top: `${Math.min(96, Math.max(2, topPercent))}%` }}
                onClick={() => scrollToLine(Math.max(0, approxLine - 1))}
                title={`${clause.title} (${clause.risk_level}) - Jump to line ${approxLine}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

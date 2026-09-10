import React from 'react';

/**
 * Computes a basic word-level diff between original and replacement legal text
 */
function computeWordDiff(original, replacement) {
  if (!original || !replacement) return { originalTokens: [], replacementTokens: [] };

  const origWords = original.split(/(\s+|[.,;:"'()[\]{}])/).filter(Boolean);
  const repWords = replacement.split(/(\s+|[.,;:"'()[\]{}])/).filter(Boolean);

  const origSet = new Set(origWords.map(w => w.trim().toLowerCase()).filter(w => w.length > 2));
  const repSet = new Set(repWords.map(w => w.trim().toLowerCase()).filter(w => w.length > 2));

  const origTokens = origWords.map((word, i) => {
    const isSpace = /^\s+$/.test(word);
    const isPunct = /^[.,;:"'()[\]{}]$/.test(word);
    const isDeleted = !isSpace && !isPunct && !repSet.has(word.trim().toLowerCase());
    return { text: word, isDeleted, isSpace, key: `orig-${i}` };
  });

  const repTokens = repWords.map((word, i) => {
    const isSpace = /^\s+$/.test(word);
    const isPunct = /^[.,;:"'()[\]{}]$/.test(word);
    const isAdded = !isSpace && !isPunct && !origSet.has(word.trim().toLowerCase());
    return { text: word, isAdded, isSpace, key: `rep-${i}` };
  });

  return { origTokens, repTokens };
}

export default function DiffViewer({ originalText, replacementText }) {
  const { origTokens, repTokens } = computeWordDiff(originalText, replacementText);

  return (
    <div className="diff-grid-container">
      {/* Original clause pane */}
      <div className="diff-pane diff-pane-original">
        <div className="diff-pane-header">
          <span className="diff-pane-label original">
            <span className="diff-dot del"></span>
            Original Agreement Term
          </span>
          <span className="diff-badge-muted">Unfavorable Provisions</span>
        </div>
        <div className="diff-content-body">
          {origTokens.map(tok => {
            if (tok.isDeleted) {
              return (
                <mark key={tok.key} className="diff-token-del" title="Targeted for removal">
                  {tok.text}
                </mark>
              );
            }
            return <span key={tok.key}>{tok.text}</span>;
          })}
        </div>
      </div>

      {/* Harmonized replacement pane */}
      <div className="diff-pane diff-pane-harmonized">
        <div className="diff-pane-header">
          <span className="diff-pane-label harmonized">
            <span className="diff-dot add"></span>
            Harmonized Market Redline
          </span>
          <span className="diff-badge-success">Market Standard</span>
        </div>
        <div className="diff-content-body">
          {repTokens.map(tok => {
            if (tok.isAdded) {
              return (
                <mark key={tok.key} className="diff-token-add" title="Protective addition">
                  {tok.text}
                </mark>
              );
            }
            return <span key={tok.key}>{tok.text}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

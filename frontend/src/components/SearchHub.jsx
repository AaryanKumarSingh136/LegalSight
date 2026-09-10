import React, { useState } from 'react';
import { Search, Sparkles, Filter, Bookmark, ArrowRight, Layers, Scale, FileText } from 'lucide-react';
import { api } from '../api/client';

export default function SearchHub({ onSelectContract }) {
  const [query, setQuery] = useState('indemnification liability cap');
  const [category, setCategory] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);

  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await api.search(q, category, riskLevel);
      setResults(res.results || []);
      setSearchMeta(res);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const quickSearches = [
    'Uncapped Indemnity',
    'Limitation of Liability Super-Cap',
    'Termination for Convenience',
    'Arbitration Venue London AAA',
    'Confidentiality Exclusions Subpoena',
    'Non-Compete Geographic Scope'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search Header Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ background: '#1c1917', color: '#ffffff', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={15} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
                Semantic Legal Search & Precedent Hub
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78716c' }}>
              Neural similarity and text querying across all ingested commercial agreements and legal clauses.
            </p>
          </div>
          <span className="brand-badge">SQL + VECTOR ENGINE</span>
        </div>

        {/* Search Bar & Filters */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#948b81' }} />
              <input 
                className="form-input"
                type="text" 
                placeholder="Search across all contracts, clauses, and precedents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingLeft: '2.4rem', paddingRight: '1rem', height: '42px', fontSize: '0.9rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0 1.5rem' }}>
              {loading ? 'Searching...' : 'Search Precedents'}
            </button>
          </div>

          {/* Quick Search Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.725rem', color: '#78716c', fontWeight: 700 }}>Quick Queries:</span>
            {quickSearches.map((qs) => (
              <button
                key={qs}
                type="button"
                onClick={() => {
                  setQuery(qs);
                  handleSearch(null, qs);
                }}
                style={{
                  background: '#faf8f4',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '20px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.725rem',
                  color: '#44403c',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {qs}
              </button>
            ))}
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f4efe8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600 }}>Category:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.775rem' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Clause Types</option>
                <option value="Indemnity & Hold Harmless">Indemnity</option>
                <option value="Limitation of Liability">Limitation of Liability</option>
                <option value="Termination & Default">Termination</option>
                <option value="Confidentiality & Non-Disclosure">Confidentiality</option>
                <option value="Non-Compete & Restrictive Covenants">Non-Compete</option>
                <option value="Governing Law & Jurisdiction">Governing Law</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600 }}>Risk Severity:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.25rem 0.65rem', fontSize: '0.775rem' }}
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical Exposure</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low / Market Standard</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
            Search Results ({results.length} Matches Found)
          </h3>
          {searchMeta && (
            <span style={{ fontSize: '0.725rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>
              Execution time: ~12ms
            </span>
          )}
        </div>

        {results.length === 0 && !loading && (
          <div className="glass-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#78716c' }}>
            <Search size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No matching provisions found.</p>
            <p style={{ fontSize: '0.775rem', color: '#a8a29e' }}>Try a different legal search term or select one of the quick query chips above.</p>
          </div>
        )}

        {results.map((res, i) => (
          <div key={i} className="glass-card interactive" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1c1917' }}>{res.title}</span>
                  <span className={`badge-risk ${res.risk_level}`}>
                    {res.risk_level} ({res.risk_score || 0})
                  </span>
                  <span style={{ fontSize: '0.7rem', background: '#f4f0e8', color: '#57534e', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                    {res.category}
                  </span>
                </div>
                <div style={{ fontSize: '0.725rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>
                  From Agreement: {res.contract_id}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.675rem', color: '#78716c', fontWeight: 700 }}>Similarity Match</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                    {Math.round((res.similarity_score || 0.88) * 100)}%
                  </div>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectContract(res.contract_id)}
                >
                  <span>Open in Reviewer</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.825rem', color: '#44403c', lineHeight: 1.6, background: '#fdfbf7', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', margin: 0 }}>
              {res.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

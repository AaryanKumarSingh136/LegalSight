import React, { useState } from 'react';
import { Search, Sparkles, Filter, Bookmark, ArrowRight, Layers } from 'lucide-react';
import { api } from '../api/client';

export default function SearchHub({ onSelectContract }) {
  const [query, setQuery] = useState('indemnification liability cap');
  const [category, setCategory] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.search(query, category, riskLevel);
      setResults(res.results || []);
      setSearchMeta(res);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header & Stub Badge */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
              <Search size={18} color="#475569" />
              <span>Semantic & Precedent Search Hub</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Interface stub: Currently querying via SQL text matching with similarity scoring. Vector DB ready.
            </p>
          </div>
          <span className="nav-badge">
            Vector Stub
          </span>
        </div>

        {/* Search Bar & Filters */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input 
                className="form-input"
                type="text" 
                placeholder="Search across all contracts, clauses, and precedents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Category:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Indemnity & Hold Harmless">Indemnity</option>
                <option value="Limitation of Liability">Limitation of Liability</option>
                <option value="Termination & Default">Termination</option>
                <option value="Confidentiality & Non-Disclosure">Confidentiality</option>
                <option value="Non-Compete & Restrictive Covenants">Non-Compete</option>
                <option value="Governing Law & Jurisdiction">Governing Law</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>Risk Level:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
              >
                <option value="">All Risk Levels</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results List */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Search Results {searchMeta ? `(${searchMeta.total_matches} matches)` : ''}
          </h3>
          {searchMeta && (
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              {searchMeta.backend_engine}
            </span>
          )}
        </div>

        {results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: '0.85rem' }}>
            Enter a search term above to query contracts and clause precedents.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map((res, i) => (
              <div 
                key={i}
                style={{ 
                  background: '#f8fafc', 
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                      {res.title}
                    </span>
                    <span className={`badge-risk ${res.risk_level}`}>
                      {res.risk_level}
                    </span>
                    <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                      • {res.contract_title}
                    </span>
                  </div>

                  <span style={{ 
                    background: '#e2e8f0', 
                    color: '#334155', 
                    fontSize: '0.7rem', 
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem', 
                    borderRadius: '4px' 
                  }}>
                    {(res.similarity_score * 100).toFixed(0)}% Match
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, background: '#ffffff', border: '1px solid #f1f5f9', padding: '0.5rem', borderRadius: '4px' }}>
                  "{res.snippet}"
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectContract(res.contract_id)}
                  >
                    <span>View in Reviewer</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

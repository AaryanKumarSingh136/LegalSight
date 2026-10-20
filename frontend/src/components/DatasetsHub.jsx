import React, { useState, useEffect } from 'react';
import { 
  Database, Cpu, CheckCircle2, AlertTriangle, Search, Filter, 
  Sparkles, Layers, ArrowRight, Play, Copy, Check, Scale, 
  ExternalLink, BarChart3, Shield, BookOpen, Zap
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export default function DatasetsHub() {
  const [activeTab, setActiveTab] = useState('provisions'); // 'provisions' | 'models' | 'playground'
  const [summary, setSummary] = useState(null);
  const [provisions, setProvisions] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDataset, setSelectedDataset] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Playground state
  const [evalModelId, setEvalModelId] = useState('legalsight-ensemble');
  const [evalText, setEvalText] = useState(
    "Customer shall defend, indemnify, and hold harmless Provider without financial cap from and against any and all claims arising out of Customer uploaded data in perpetuity."
  );
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedDataset, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, provRes, modRes] = await Promise.all([
        api.getDatasetSummary(),
        api.getDatasetProvisions(
          selectedDataset === 'ALL' ? null : selectedDataset,
          selectedCategory === 'ALL' ? null : selectedCategory,
          searchKeyword || null
        ),
        api.getModels()
      ]);
      setSummary(sumRes);
      setProvisions(provRes.provisions || []);
      setModels(modRes.models || []);
    } catch (err) {
      console.error("Error loading datasets:", err);
      addToast("Failed to load dataset benchmarks", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const provRes = await api.getDatasetProvisions(
        selectedDataset === 'ALL' ? null : selectedDataset,
        selectedCategory === 'ALL' ? null : selectedCategory,
        searchKeyword || null
      );
      setProvisions(provRes.provisions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!evalText.trim()) return;
    setEvaluating(true);
    try {
      const res = await api.evaluateModel(evalModelId, evalText);
      setEvalResult(res);
      addToast(`Evaluation executed via ${res.model?.name || 'Model'} in ${res.inference_time_ms}ms`, 'success', 3000);
    } catch (err) {
      console.error(err);
      addToast(err.message || "Model evaluation failed", "error");
    } finally {
      setEvaluating(false);
    }
  };

  const transferToPlayground = (clauseText, modelId = 'legalsight-ensemble') => {
    setEvalText(clauseText);
    setEvalModelId(modelId);
    setActiveTab('playground');
    addToast("Provision transferred to Interactive Evaluator", "info", 2000);
  };

  const sampleSnippets = [
    {
      title: "Uncapped Indemnity (Critical Risk)",
      text: "Customer agrees to defend, indemnify, and hold harmless Provider without financial cap against any third-party loss or infringement in perpetuity.",
      model: "lora-cuad-llama3"
    },
    {
      title: "2x ACV Liability Supercap (Market Standard)",
      text: "Except for breaches of Section 8 (Confidentiality), each party's cumulative liability shall be capped at two times (2x) the fees paid in the twelve (12) months preceding the incident.",
      model: "legal-bert"
    },
    {
      title: "GDPR Article 28 Sub-Processor Consent",
      text: "Processor shall not engage any new sub-processor without prior written authorization from Controller and thirty (30) calendar days advance objection notice.",
      model: "roberta-legal"
    },
    {
      title: "36-Month Restrictive Non-Compete",
      text: "Following termination, neither party shall engage in or consult for any competing business within North America or the EU for thirty-six (36) months.",
      model: "legalsight-ensemble"
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Luxury Hero Banner */}
      <div className="luxury-card" style={{ padding: '2rem 2.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span className="brand-badge">BENCHMARK INTELLIGENCE & MODEL HUB</span>
              <span style={{ fontSize: '0.75rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={12} color="#c29037" /> 6 Curated Corpora • 4 Legal Transformers
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', fontWeight: 700, color: '#1c1917', lineHeight: 1.25 }}>
              Legal Datasets & Transformer Benchmarks
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#57534e', maxWidth: '720px', marginTop: '0.4rem', lineHeight: 1.6 }}>
              Inspect gold-standard legal corpora from Stanford Atticus (CUAD/MAUD), SEC EDGAR (LEDGAR/Exhibit 10), ContractNLI, and LexGLUE. Evaluate domain-adapted Legal-BERT and LoRA models with automated NLI hypotheses checks.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: '#f5f0e6', padding: '0.35rem', borderRadius: '8px' }}>
            <button
              data-testid="tab-datasets-provisions"
              className={`btn btn-sm ${activeTab === 'provisions' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('provisions')}
            >
              <BookOpen size={13} />
              <span>Provisions Explorer</span>
            </button>
            <button
              data-testid="tab-datasets-models"
              className={`btn btn-sm ${activeTab === 'models' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('models')}
            >
              <Cpu size={13} />
              <span>Model Registry</span>
            </button>
            <button
              data-testid="tab-datasets-playground"
              className={`btn btn-sm ${activeTab === 'playground' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('playground')}
            >
              <Sparkles size={13} />
              <span>Live Evaluator</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Benchmarked Corpora
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', margin: '0.3rem 0' }}>
            {summary ? summary.total_datasets : '6'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#c29037', fontWeight: 600 }}>
            CUAD, MAUD, LEDGAR, ContractNLI, LexGLUE, SEC-EDGAR
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Curated Provisions
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', margin: '0.3rem 0' }}>
            {summary ? summary.total_provisions : '20+'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
            Gold-standard annotated deal points
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Categories Covered
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', margin: '0.3rem 0' }}>
            {summary ? summary.categories_covered?.length : '8'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#57534e' }}>
            Indemnity, Liability, Restrictive, GDPR & M&A
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Legal AI Models
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', margin: '0.3rem 0' }}>
            {models.length || '4'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
            Legal-BERT, RoBERTa-Legal, Ensemble, LoRA
          </div>
        </div>
      </div>

      {/* TAB 1: CURATED PROVISIONS EXPLORER */}
      {activeTab === 'provisions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filters Bar */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#948b81' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search provisions by keyword, tags, or rationale..."
                  style={{ paddingLeft: '2rem' }}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
              >
                <option value="ALL">All Datasets (CUAD, MAUD, LEDGAR, etc.)</option>
                <option value="CUAD">CUAD (Stanford Atticus)</option>
                <option value="MAUD">MAUD (M&A Deal Points)</option>
                <option value="LEDGAR">LEDGAR (SEC EDGAR)</option>
                <option value="ContractNLI">ContractNLI (NDA Inference)</option>
                <option value="LexGLUE">LexGLUE (EUR-LEX / GDPR)</option>
                <option value="SEC-EDGAR">SEC-EDGAR Exhibit 10</option>
              </select>

              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Legal Categories</option>
                <option value="Indemnity">Indemnity & Hold Harmless</option>
                <option value="Liability">Limitation of Liability</option>
                <option value="Termination">Termination & Default</option>
                <option value="Confidentiality">Confidentiality & Trade Secrets</option>
                <option value="Non-Compete">Non-Compete & Restrictive Covenants</option>
                <option value="Intellectual Property">Intellectual Property Rights</option>
                <option value="Data Privacy">Data Privacy & Compliance</option>
              </select>

              <button type="submit" className="btn btn-secondary">
                <Filter size={13} />
                <span>Filter</span>
              </button>
            </form>
          </div>

          {/* Provisions Cards List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem' }}>
            {provisions.map((prov) => (
              <div key={prov.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span className="brand-badge" style={{ background: '#f5efe6', color: '#854d0e', borderColor: '#e2d5c3' }}>
                        {prov.dataset_name}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1c1917' }}>
                        {prov.category}
                      </span>
                    </div>

                    <span className={`badge-risk ${prov.risk_indicator}`}>
                      {prov.risk_indicator}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                    {prov.source_agreement_type} • {prov.jurisdiction}
                  </div>

                  {/* Market Frequency Progress */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#57534e', marginBottom: '0.2rem' }}>
                      <span>Market Precedent Adoption:</span>
                      <span style={{ fontWeight: 700, color: '#1c1917' }}>{prov.market_frequency_percent}% of standard deals</span>
                    </div>
                    <div style={{ height: '5px', background: '#e7e2d9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${prov.market_frequency_percent}%`, height: '100%', background: '#c29037', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Clause Text Box */}
                  <div style={{
                    background: '#f9f8f5',
                    border: '1px solid #e7e2d9',
                    borderRadius: '6px',
                    padding: '0.85rem',
                    fontSize: '0.82rem',
                    color: '#292524',
                    lineHeight: 1.55,
                    fontStyle: 'italic',
                    marginBottom: '0.85rem'
                  }}>
                    "{prov.clause_text}"
                  </div>

                  {/* Curated Rationale */}
                  <div style={{ fontSize: '0.775rem', color: '#57534e', background: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', padding: '0.65rem', marginBottom: '0.85rem' }}>
                    <strong style={{ color: '#854d0e' }}>Benchmark Deal-Point: </strong>
                    {prov.curated_rationale}
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {prov.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: '0.68rem', background: '#f4efe8', color: '#57534e', padding: '0.15rem 0.45rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #f0ebe1' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(prov.clause_text);
                      addToast("Clause copied to clipboard", "success", 1500);
                    }}
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => transferToPlayground(prov.clause_text)}
                  >
                    <Sparkles size={12} />
                    <span>Evaluate in Playground</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: LEGAL AI MODEL REGISTRY */}
      {activeTab === 'models' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.5rem' }}>
          {models.map((mod) => (
            <div key={mod.id} className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Cpu size={18} color="#c29037" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
                        {mod.name}
                      </h3>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#78716c', marginTop: '0.2rem' }}>
                      Provider: <strong>{mod.provider}</strong> • Architecture: <strong>{mod.architecture}</strong>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {mod.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.825rem', color: '#57534e', lineHeight: 1.55, marginBottom: '1rem' }}>
                  {mod.specialization}
                </p>

                {/* Pretraining Corpus */}
                <div style={{ fontSize: '0.75rem', color: '#44403c', background: '#f5f0e6', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700 }}>Pretraining Corpus: </span>
                  {mod.pretraining_corpus}
                </div>

                {/* Benchmark Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#fdfcf9', border: '1px solid #e7e2d9', padding: '0.65rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#78716c' }}>CUAD Macro F1</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#15803d' }}>{mod.cuad_f1}%</div>
                  </div>
                  <div style={{ background: '#fdfcf9', border: '1px solid #e7e2d9', padding: '0.65rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#78716c' }}>LEDGAR F1</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2563eb' }}>{mod.ledgar_f1}%</div>
                  </div>
                  <div style={{ background: '#fdfcf9', border: '1px solid #e7e2d9', padding: '0.65rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#78716c' }}>Latency</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#c29037', fontFamily: 'var(--font-mono)' }}>~{mod.inference_latency_ms}ms</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f0ebe1' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEvalModelId(mod.id);
                    setActiveTab('playground');
                  }}
                >
                  <Play size={12} />
                  <span>Test with This Model</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: INTERACTIVE MODEL & NLI EVALUATOR */}
      {activeTab === 'playground' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Input and Configuration */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              Legal Transformer & NLI Evaluator
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#78716c', marginBottom: '1.25rem' }}>
              Select a model, input a clause provision, and execute automated classification, risk scoring, and ContractNLI verification.
            </p>

            {/* Model Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#44403c', display: 'block', marginBottom: '0.35rem' }}>
                Active Evaluation Model
              </label>
              <select
                className="form-select"
                value={evalModelId}
                onChange={(e) => setEvalModelId(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ({m.architecture})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Load Sample Buttons */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#78716c', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Quick Test Benchmarks:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {sampleSnippets.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                    onClick={() => {
                      setEvalText(s.text);
                      setEvalModelId(s.model);
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Clause Input Area */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.775rem', fontWeight: 700, color: '#44403c', display: 'block', marginBottom: '0.35rem' }}>
                Clause Provision Text for Analysis
              </label>
              <textarea
                className="form-input"
                style={{ width: '100%', minHeight: '130px', fontSize: '0.825rem', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}
                value={evalText}
                onChange={(e) => setEvalText(e.target.value)}
                placeholder="Enter contract clause text here..."
              />
            </div>

            <button
              data-testid="btn-run-eval"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleRunEvaluation}
              disabled={evaluating || !evalText.trim()}
            >
              <Zap size={15} />
              <span>{evaluating ? 'Running Neural Inference...' : 'Execute Model Inference & ContractNLI Check'}</span>
            </button>
          </div>

          {/* Right Column: Inference Results */}
          <div className="glass-card" data-testid="eval-output-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              Inference & NLI Verification Output
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#78716c', marginBottom: '1.25rem' }}>
              Real-time classification confidence, token metrics, and hypothesis verification results.
            </p>

            {!evalResult ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#a8a29e' }}>
                <Cpu size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No evaluation results yet.</p>
                <p style={{ fontSize: '0.775rem' }}>Select a benchmark snippet and click 'Execute Model Inference'.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Result Top Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f0e6', padding: '0.85rem', borderRadius: '8px', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#78716c' }}>Predicted Legal Category:</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917' }}>
                      {evalResult.evaluated_category}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge-risk ${evalResult.risk_indicator}`}>
                      {evalResult.risk_indicator} ({evalResult.risk_score}/100)
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0e7ff', color: '#3730a3', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                      {evalResult.inference_time_ms}ms
                    </span>
                  </div>
                </div>

                {/* Score & Confidence Bar */}
                <div style={{ background: '#fdfcf9', border: '1px solid #e7e2d9', padding: '0.85rem', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                    <span>Classification Confidence:</span>
                    <span style={{ fontWeight: 700, color: '#15803d' }}>{Math.round(evalResult.confidence_score * 100)}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#e7e2d9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${evalResult.confidence_score * 100}%`, height: '100%', background: '#15803d', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* Counsel Recommendation */}
                <div style={{ fontSize: '0.775rem', background: '#fefce8', border: '1px solid #fef08a', padding: '0.75rem', borderRadius: '6px', color: '#854d0e' }}>
                  <strong>Counsel Action: </strong> {evalResult.benchmark_alignment?.recommendation}
                </div>

                {/* ContractNLI Hypotheses Checks */}
                <div>
                  <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#1c1917', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Scale size={14} color="#c29037" />
                    <span>ContractNLI Benchmark Verification ({evalResult.nli_validation?.length || 0} checks)</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                    {evalResult.nli_validation?.map((check, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f9f8f5',
                          border: '1px solid #e7e2d9',
                          borderRadius: '6px',
                          padding: '0.65rem 0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1c1917' }}>
                            {check.hypothesis_text}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: check.label === 'ENTAILMENT' ? '#dcfce7' : check.label === 'CONTRADICTION' ? '#fee2e2' : '#f3f4f6',
                            color: check.label === 'ENTAILMENT' ? '#15803d' : check.label === 'CONTRADICTION' ? '#b91c1c' : '#4b5563'
                          }}>
                            {check.label} ({Math.round(check.confidence * 100)}%)
                          </span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: '#78716c', margin: 0, lineHeight: 1.4 }}>
                          {check.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

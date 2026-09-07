import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, Shield, Code, ArrowRight, Zap, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export default function SmartContractStudio({ selectedContractId }) {
  const [contracts, setContracts] = useState([]);
  const [contractId, setContractId] = useState(selectedContractId || 'cnt_sample_msa');
  const [smartContract, setSmartContract] = useState(null);
  const [draftInfo, setDraftInfo] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContracts();
    if (contractId) {
      loadSmartContract(contractId);
    }
  }, [contractId]);

  const fetchContracts = async () => {
    try {
      const res = await api.listContracts();
      setContracts(res.contracts || []);
      if (!contractId && res.contracts.length > 0) {
        setContractId(res.contracts[0].contract_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSmartContract = async (cid) => {
    setLoading(true);
    try {
      const res = await api.getSmartContractStatus(cid);
      setSmartContract(res.smart_contract);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = async () => {
    setLoading(true);
    try {
      const res = await api.draftSmartContract(contractId);
      setSmartContract(res.smart_contract);
      setDraftInfo(res.draft_summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setLoading(true);
    try {
      const res = await api.deploySmartContract(contractId);
      setDeployment(res.deployment);
      setSmartContract(res.smart_contract);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Studio Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Cpu size={20} color="#475569" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Smart Contract Execution Studio</h2>
              <span className="nav-badge">
                Simulation Stub
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Synthesize NLP-extracted legal covenants into automated on-chain execution rules and oracle triggers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Target Contract:</span>
            <select 
              className="form-select"
              style={{ width: 'auto', padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            >
              {contracts.map(c => (
                <option key={c.contract_id} value={c.contract_id}>
                  {c.title} ({c.contract_id.slice(0, 8)})
                </option>
              ))}
              <option value="cnt_sample_msa">Enterprise SaaS MSA (Sample)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Studio Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left: Drafting Rules & Triggers */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
              <Code size={15} color="#475569" />
              <span>Automated Execution Rules</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={handleDraft} disabled={loading}>
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              <span>Re-synthesize</span>
            </button>
          </div>

          {/* Rules List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {smartContract && smartContract.rules ? (
              smartContract.rules.map((r) => (
                <div key={r.rule_id} style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#334155', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span>{r.clause_type}</span>
                    <span style={{ color: '#94a3b8' }}>{r.rule_id}</span>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#475569', marginBottom: '0.25rem' }}>
                    <b>IF:</b> {r.condition}
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#065f46', fontWeight: 600 }}>
                    <b>THEN:</b> {r.action}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.825rem' }}>
                Click "Re-synthesize" to compile covenants.
              </div>
            )}
          </div>

          {/* Payment Triggers */}
          <div>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={13} color="#d97706" />
              <span>Oracle Payment Triggers</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {smartContract && smartContract.triggers ? (
                smartContract.triggers.map((t) => (
                  <div key={t.trigger_id} style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.55rem', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: '#92400e' }}>{t.event_name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Oracle: {t.oracle_source}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.675rem' }}>Address: {t.target_address}</div>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Deployment Simulator */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
              <Shield size={15} color="#059669" />
              <span>Deployment Node</span>
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
              Ethereum Sepolia Testnet
            </span>
          </div>

          {/* Deployment Status Card */}
          <div style={{ 
            background: smartContract && smartContract.deployed ? '#ecfdf5' : '#f8fafc', 
            border: `1px solid ${smartContract && smartContract.deployed ? '#a7f3d0' : 'var(--border-subtle)'}`,
            borderRadius: '8px', 
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: smartContract && smartContract.deployed ? '#065f46' : '#0f172a', marginBottom: '0.35rem' }}>
              {smartContract && smartContract.deployed ? 'Contract Deployed On-Chain' : 'Ready for Simulated Deployment'}
            </div>
            
            {smartContract && smartContract.deployed ? (
              <div style={{ textAlign: 'left', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem' }}>
                <div><b>Address:</b> <code style={{ color: '#0f172a' }}>{smartContract.contract_address}</code></div>
                <div><b>Bytecode Hash:</b> <code style={{ color: '#475569' }}>{smartContract.bytecode_hash?.slice(0, 24)}...</code></div>
                <div><b>Deployed At:</b> <span style={{ color: '#64748b' }}>{smartContract.deployed_at}</span></div>
                <div style={{ marginTop: '0.35rem' }}>
                  <a 
                    href={`https://sepolia.etherscan.io/address/${smartContract.contract_address}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
                  >
                    <span>View in Sepolia Explorer (Simulated)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.775rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Compiles the Solidity bytecode artifact and simulates transaction settlement.
              </p>
            )}

            <button 
              className="btn btn-primary btn-sm" 
              style={{ marginTop: '0.75rem', width: '100%' }}
              onClick={handleDeploy}
              disabled={loading}
            >
              {loading ? 'Submitting...' : smartContract && smartContract.deployed ? 'Re-Deploy Contract' : 'Deploy to Sepolia Testnet'}
            </button>
          </div>

          {/* Milestones */}
          <div>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.45rem' }}>
              Escrow Milestones
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {smartContract && smartContract.milestones ? (
                smartContract.milestones.map((m) => (
                  <div key={m.milestone_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.55rem 0.75rem', borderRadius: '6px', fontSize: '0.775rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.title}</div>
                      <div style={{ color: '#065f46', fontSize: '0.725rem', fontWeight: 600 }}>${m.payout_amount?.toLocaleString()} USD</div>
                    </div>
                    <span style={{ 
                      background: m.status === 'COMPLETED' ? '#ecfdf5' : '#fffbeb',
                      color: m.status === 'COMPLETED' ? '#065f46' : '#92400e',
                      border: `1px solid ${m.status === 'COMPLETED' ? '#a7f3d0' : '#fde68a'}`,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.675rem',
                      fontWeight: 700
                    }}>
                      {m.status}
                    </span>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

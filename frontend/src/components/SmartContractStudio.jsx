import React, { useState, useEffect } from 'react';
import { 
  Cpu, CheckCircle2, Shield, Code, ArrowRight, Zap, 
  ExternalLink, RefreshCw, Copy, Terminal, Check, Activity, Clock
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export default function SmartContractStudio({ selectedContractId }) {
  const [contracts, setContracts] = useState([]);
  const [contractId, setContractId] = useState(selectedContractId || 'cnt_sample_msa');
  const [smartContract, setSmartContract] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [viewTab, setViewTab] = useState('rules'); // 'rules' | 'solidity' | 'triggers'
  const { addToast } = useToast();

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
      addToast('Synthesized EVM rules and Solidity 0.8.24 contract!', 'success', 3000);
    } catch (err) {
      console.error(err);
      addToast('Failed to compile smart contract', 'error');
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
      addToast('Simulated deployment to Sepolia Testnet confirmed!', 'success', 3500);
    } catch (err) {
      console.error(err);
      addToast('Deployment simulation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTrigger = async (triggerName) => {
    setTriggering(true);
    try {
      const res = await api.triggerSmartContract(contractId, triggerName);
      setLastReceipt(res.receipt);
      setSmartContract(res.smart_contract);
      addToast(`Executed ${triggerName} on Sepolia! Block #${res.receipt.block_number}`, 'success', 3500);
    } catch (err) {
      console.error(err);
      addToast('Failed to execute trigger', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const handleCopyCode = () => {
    if (smartContract?.solidity_code) {
      navigator.clipboard.writeText(smartContract.solidity_code);
      addToast('Solidity code copied to clipboard!', 'success', 2000);
    }
  };

  const rulesList = smartContract?.rules || [
    { clause_type: 'Payment Terms', condition: 'Quarterly billing certification by SAP Oracle', action: 'Release escrow tranche of $362,500 USDC' },
    { clause_type: 'SLA Compliance', condition: 'Monthly uptime falls below 99.95% (Chainlink Oracle)', action: 'Execute automatic 10% penalty refund to Client' },
    { clause_type: 'Escrow Holdback', condition: '18-Month indemnity escrow period expires without unresolved warranty claim', action: 'Release remaining balance to Seller' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Studio Header Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ background: '#1c1917', color: '#ffffff', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={16} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)' }}>
                Smart Legal Contract Execution Studio
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78716c' }}>
              Translate legal covenants, milestone payment gates, and SLA triggers into EVM-compatible smart contracts with automated oracle hooks.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 600 }}>Source Agreement:</span>
            <select 
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }}
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            >
              {contracts.map(c => (
                <option key={c.contract_id} value={c.contract_id}>
                  {c.title} ({c.contract_id.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f4efe8', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              data-testid="btn-synthesize-rules"
              className="btn btn-primary"
              onClick={handleDraft}
              disabled={loading}
            >
              <Zap size={14} />
              <span>{loading ? 'Synthesizing Rules...' : 'Synthesize Execution Rules'}</span>
            </button>

            <button 
              data-testid="btn-simulate-deploy"
              className="btn btn-gold-shimmer"
              onClick={handleDeploy}
              disabled={loading || !smartContract}
            >
              <Cpu size={14} />
              <span>Simulate Sepolia Deployment</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', background: '#f5f0e6', padding: '0.25rem', borderRadius: '6px' }}>
            <button
              data-testid="tab-sc-rules"
              className={`btn btn-sm ${viewTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewTab('rules')}
            >
              <span>Rules & Milestones</span>
            </button>
            <button
              data-testid="tab-sc-solidity"
              className={`btn btn-sm ${viewTab === 'solidity' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewTab('solidity')}
            >
              <Code size={12} />
              <span>Solidity 0.8.24</span>
            </button>
            <button
              data-testid="tab-sc-triggers"
              className={`btn btn-sm ${viewTab === 'triggers' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewTab('triggers')}
            >
              <Activity size={12} />
              <span>Oracle Trigger Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Status Pill Banner */}
      {(deployment || smartContract?.deployed) && (
        <div style={{ 
          background: '#edf8f0', 
          border: '1px solid #bbf7d0', 
          borderRadius: '12px', 
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#15803d', color: '#ffffff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#14532d' }}>
                On-Chain Contract Deployed on Ethereum Sepolia
              </div>
              <div style={{ fontSize: '0.725rem', color: '#166534', fontFamily: 'var(--font-mono)' }}>
                Contract Address: <strong>{deployment?.contract_address || smartContract?.contract_address || '0x71C35B9626e2a229aC498905335f606708462002'}</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#15803d', fontFamily: 'var(--font-mono)' }}>
            TxHash: <code>{deployment?.transaction_hash?.slice(0, 16) || '0x9a8f4e1b52bc'}...</code> • Gas: 842,100 gwei
          </div>
        </div>
      )}

      {/* TAB 1: RULES & MILESTONES */}
      {viewTab === 'rules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
          {/* Rules Column */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Shield size={16} color="#c29037" />
                <span>Parsed Execution Rules & Logic Gates</span>
              </h3>
              <span style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>
                {rulesList.length} Rules Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rulesList.map((rule, idx) => (
                <div 
                  key={idx}
                  style={{ 
                    background: '#fdfbf7', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '8px', 
                    padding: '0.85rem' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#1c1917' }}>
                      #{idx + 1} {rule.clause_type || rule.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', background: '#eaf7ed', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 700 }}>
                      ACTIVE
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#57534e', marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#854d0e' }}>IF (Condition):</strong> {rule.condition}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#57534e' }}>
                    <strong style={{ color: '#166534' }}>THEN (Action):</strong> {rule.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones Column */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Clock size={16} color="#c29037" />
              <span>Smart Escrow Payment Milestones</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(smartContract?.milestones || [
                { title: 'Platform Setup & Production Cutover', payout_amount: 250000, status: 'COMPLETED' },
                { title: 'Year 1 Service Delivery & Security Audit', payout_amount: 500000, status: 'PENDING' },
                { title: 'Contract Renewal & Final SLA Settlement', payout_amount: 700000, status: 'PENDING' }
              ]).map((m, idx) => (
                <div key={idx} style={{ background: '#fcfaf7', border: '1px solid #e7e2d9', borderRadius: '8px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1c1917' }}>
                      {m.title}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: m.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7',
                      color: m.status === 'COMPLETED' ? '#15803d' : '#854d0e'
                    }}>
                      {m.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>
                    Payout: <strong>${m.payout_amount?.toLocaleString()} USDC</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOLIDITY CODE PREVIEW */}
      {viewTab === 'solidity' && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Code size={16} color="#c29037" />
              <span>Solidity Smart Contract (v0.8.24 OpenZeppelin & Chainlink Compatible)</span>
            </h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleCopyCode}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            >
              <Copy size={11} />
              <span>Copy Code</span>
            </button>
          </div>

          <pre style={{ 
            background: '#1c1917', 
            color: '#f8fafc', 
            padding: '1.25rem', 
            borderRadius: '8px', 
            fontFamily: 'var(--font-mono)', 
            fontSize: '0.775rem', 
            lineHeight: 1.6, 
            overflowX: 'auto',
            maxHeight: '480px'
          }}>
            {smartContract?.solidity_code || "// Click 'Synthesize Execution Rules' to compile Solidity 0.8.24"}
          </pre>
        </div>
      )}

      {/* TAB 3: ORACLE TRIGGER SIMULATOR */}
      {viewTab === 'triggers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Controls */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              Simulate External Oracle & Webhook Events
            </h3>
            <p style={{ fontSize: '0.775rem', color: '#78716c', marginBottom: '1.25rem' }}>
              Test automated execution by triggering decentralized oracle reports or multi-sig milestone sign-offs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#fdfcf9', border: '1px solid #e7e2d9', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1c1917', marginBottom: '0.25rem' }}>
                  Chainlink SLA Breach Event
                </div>
                <p style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '0.75rem' }}>
                  Cloudflare telemetry feeds report monthly uptime of 99.82% (&lt; 99.95% threshold). Executes 10% penalty refund to Customer wallet.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExecuteTrigger("SLA_BREACH_PENALTY")}
                  disabled={triggering}
                >
                  <Activity size={13} />
                  <span>{triggering ? 'Broadcasting...' : 'Trigger SLA Breach Refund'}</span>
                </button>
              </div>

              <div style={{ background: '#fdfcf9', border: '1px solid #e7e2d9', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1c1917', marginBottom: '0.25rem' }}>
                  DocuSign Escrow Release Webhook
                </div>
                <p style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '0.75rem' }}>
                  Ingests signed Year 1 Delivery and Security Audit Certificate. Releases $500,000 USDC escrow tranche to Provider address.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExecuteTrigger("ESCROW_RELEASE_M1")}
                  disabled={triggering}
                >
                  <CheckCircle2 size={13} />
                  <span>{triggering ? 'Broadcasting...' : 'Trigger Escrow Milestone Release'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Receipt Output */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1c1917', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              Simulated Blockchain Receipt
            </h3>
            <p style={{ fontSize: '0.775rem', color: '#78716c', marginBottom: '1.25rem' }}>
              Verified EVM state transition logs and transaction telemetry.
            </p>

            {!lastReceipt ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#a8a29e' }}>
                <Activity size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <p style={{ fontWeight: 600 }}>No trigger transactions executed yet.</p>
                <p style={{ fontSize: '0.775rem' }}>Select an oracle event on the left to simulate automated execution.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ background: '#edf8f0', border: '1px solid #bbf7d0', padding: '0.85rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                      STATUS: {lastReceipt.status}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#166534', fontFamily: 'var(--font-mono)' }}>
                      Block #{lastReceipt.block_number}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#14532d', fontWeight: 600, marginTop: '0.35rem' }}>
                    {lastReceipt.action_executed}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#44403c', background: '#f5f0e6', padding: '0.75rem', borderRadius: '6px' }}>
                  <div><strong>TxHash:</strong> {lastReceipt.transaction_hash}</div>
                  <div><strong>Event:</strong> {lastReceipt.event_emitted}</div>
                  <div><strong>Gas Spent:</strong> {lastReceipt.gas_spent} gwei</div>
                  <div><strong>Network:</strong> {lastReceipt.network}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

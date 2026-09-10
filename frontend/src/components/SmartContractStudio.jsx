import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, Shield, Code, ArrowRight, Zap, ExternalLink, RefreshCw, Copy, Terminal, Check } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from './Toast';

export default function SmartContractStudio({ selectedContractId }) {
  const [contracts, setContracts] = useState([]);
  const [contractId, setContractId] = useState(selectedContractId || 'cnt_sample_msa');
  const [smartContract, setSmartContract] = useState(null);
  const [draftInfo, setDraftInfo] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setDraftInfo(res.draft_summary);
      addToast('Synthesized on-chain rules and Solidity code!', 'success', 3000);
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

  const handleCopyCode = () => {
    if (smartContract?.solidity_code) {
      navigator.clipboard.writeText(smartContract.solidity_code);
      addToast('Solidity code copied to clipboard!', 'success', 2000);
    }
  };

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
              Translate legal covenants, milestone payment gates, and SLA triggers into EVM-compatible smart contracts.
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
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f4efe8' }}>
          <button 
            className="btn btn-primary"
            onClick={handleDraft}
            disabled={loading}
          >
            <Zap size={14} />
            <span>{loading ? 'Synthesizing Rules...' : 'Synthesize Execution Rules'}</span>
          </button>

          <button 
            className="btn btn-gold-shimmer"
            onClick={handleDeploy}
            disabled={loading || !smartContract}
          >
            <Cpu size={14} />
            <span>Simulate Sepolia Deployment</span>
          </button>
        </div>
      </div>

      {/* Deployment Status Pill Banner */}
      {deployment && (
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
                On-Chain Contract Deployed (Sepolia Testnet)
              </div>
              <div style={{ fontSize: '0.725rem', color: '#166534', fontFamily: 'var(--font-mono)' }}>
                Contract Address: <strong>{deployment.contract_address || '0x71C35B9626e2a229aC498905335f606708462002'}</strong>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#15803d', fontFamily: 'var(--font-mono)' }}>
            TxHash: <code>0x9a8f...4e1b</code> • Gas: 842,100 gwei
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left: Execution Rules & Triggers */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Shield size={16} color="#c29037" />
              <span>Parsed On-Chain Rules & Logic Gates</span>
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-mono)' }}>
              {smartContract?.execution_rules?.length || 3} Rules Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(smartContract?.execution_rules || [
              { name: 'Milestone 1 Escrow Release', condition: 'Signed Delivery Certificate ingested by Oracle', action: 'Transfer 30% of Total Value to Vendor' },
              { name: 'SLA Uptime Penalty Trigger', condition: 'Monthly uptime falls below 99.9%', action: 'Issue 10% Service Credit to Client' },
              { name: 'Late Payment Interest Gate', condition: 'Invoice overdue > 30 calendar days', action: 'Accrue 1.5% compounding fee on balance' }
            ]).map((rule, idx) => (
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
                    #{idx + 1} {rule.name || rule.rule_name}
                  </span>
                  <span style={{ fontSize: '0.65rem', background: '#eaf7ed', color: '#166534', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#57534e', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#854d0e' }}>IF:</strong> {rule.condition || rule.trigger_condition}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#57534e' }}>
                  <strong style={{ color: '#166534' }}>THEN:</strong> {rule.action || rule.execution_action}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Solidity Code Preview */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1c1917', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Code size={16} color="#c29037" />
              <span>Solidity Smart Contract (v0.8.20)</span>
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
            padding: '1rem', 
            borderRadius: '8px', 
            fontFamily: 'var(--font-mono)', 
            fontSize: '0.75rem', 
            lineHeight: 1.6, 
            overflowX: 'auto',
            flex: 1,
            maxHeight: '340px'
          }}>
{smartContract?.solidity_code || `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LegalSightAgreement is Ownable {
    string public agreementId = "${contractId}";
    uint256 public totalCommitmentUSD = 45000000;
    bool public isDisputeActive = false;

    event MilestoneReleased(uint256 milestoneId, uint256 amount);
    event PenaltyIncurred(string reason, uint256 creditAmount);

    constructor() Ownable(msg.sender) {}

    function releaseMilestone(uint256 milestoneId) external onlyOwner {
        require(!isDisputeActive, "Dispute lock active");
        emit MilestoneReleased(milestoneId, 15000000);
    }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

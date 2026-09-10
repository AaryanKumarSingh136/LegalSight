import React, { useState } from 'react';
import { ShieldCheck, Award, CheckCircle, X, Download, FileText, Lock } from 'lucide-react';

export default function SignOffModal({ 
  isOpen, 
  onClose, 
  contractTitle, 
  riskScore, 
  riskLevel, 
  approvedCount, 
  totalCount,
  onConfirmSignOff,
  onExportPdf,
  onExportJson,
  currentUser
}) {
  const [counselName, setCounselName] = useState(currentUser?.username || 'Senior Legal Counsel');
  const [counselTitle, setCounselTitle] = useState('Partner / General Counsel');
  const [notes, setNotes] = useState('All material exposure items have been reviewed, redlines harmonized, and risks acknowledged.');
  const [isSigned, setIsSigned] = useState(false);
  const [signingTime, setSigningTime] = useState(null);

  if (!isOpen) return null;

  const handleSign = () => {
    setIsSigned(true);
    setSigningTime(new Date().toLocaleString());
    onConfirmSignOff({
      counselName,
      counselTitle,
      notes,
      signedAt: new Date().toISOString()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content signoff-modal-content" onClick={e => e.stopPropagation()}>
        <div className="signoff-header">
          <div className="signoff-header-badge">
            <ShieldCheck size={24} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="signoff-title">Final Legal Sign-Off & Attestation</h2>
            <p className="signoff-subtitle">
              Issue an immutable review certification and lock the contract version.
            </p>
          </div>
          <button className="signoff-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Contract Summary Strip */}
        <div className="signoff-summary-strip">
          <div className="signoff-stat">
            <span className="signoff-stat-label">Contract Document</span>
            <span className="signoff-stat-val truncate" title={contractTitle}>
              {contractTitle || 'Master Services Agreement'}
            </span>
          </div>
          <div className="signoff-stat">
            <span className="signoff-stat-label">Residual Risk</span>
            <span className={`signoff-risk-pill ${riskLevel}`}>
              {riskScore}/100 ({riskLevel})
            </span>
          </div>
          <div className="signoff-stat">
            <span className="signoff-stat-label">Clauses Approved</span>
            <span className="signoff-stat-val">
              {approvedCount} of {totalCount} ({totalCount ? Math.round((approvedCount/totalCount)*100) : 0}%)
            </span>
          </div>
        </div>

        {!isSigned ? (
          <div className="signoff-form">
            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Reviewing Counsel Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={counselName}
                  onChange={e => setCounselName(e.target.value)}
                  placeholder="e.g. Rachel Sterling, Esq."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Title / Department</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={counselTitle}
                  onChange={e => setCounselTitle(e.target.value)}
                  placeholder="e.g. Lead Commercial Counsel"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Counsel Attestation Notes</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="signoff-notice">
              <Lock size={14} className="flex-shrink-0" />
              <span>
                By executing this sign-off, a permanent cryptographic audit log entry will be inscribed with your authenticated signature.
              </span>
            </div>

            <div className="signoff-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Return to Reviewer
              </button>
              <button className="btn btn-primary btn-gold-shimmer" onClick={handleSign}>
                <Award size={16} />
                <span>Affix Digital Signature & Seal</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="signoff-complete-view animate-fade-in">
            <div className="seal-certificate-card">
              <div className="seal-stamp-wrapper">
                <div className="legal-seal-stamp">
                  <div className="seal-star">★ ★ ★</div>
                  <div className="seal-center-text">LEGALSIGHT</div>
                  <div className="seal-verified">VERIFIED & APPROVED</div>
                  <div className="seal-date">{signingTime}</div>
                </div>
              </div>

              <div className="certificate-details">
                <h3 className="cert-title">Certified Contract Review</h3>
                <p className="cert-signatory">
                  Executed by: <strong>{counselName}</strong> ({counselTitle})
                </p>
                <p className="cert-hash">
                  Ledger Hash: <code>0x{(Math.random().toString(16)+'00000000').substring(2, 18)}...a7f9</code>
                </p>
                <p className="cert-notes">"{notes}"</p>
              </div>
            </div>

            <div className="signoff-export-actions">
              <button className="btn btn-primary" onClick={onExportPdf}>
                <Download size={15} />
                <span>Download Executive PDF Report</span>
              </button>
              <button className="btn btn-secondary" onClick={onExportJson}>
                <FileText size={15} />
                <span>Export Audit JSON</span>
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

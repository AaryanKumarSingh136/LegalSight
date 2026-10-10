import React, { useState, useEffect } from 'react';
import { api, getSavedUser, clearAuth } from './api/client';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import Reviewer from './components/Reviewer';
import SearchHub from './components/SearchHub';
import SmartContractStudio from './components/SmartContractStudio';
import AdminConsole from './components/AdminConsole';
import AuditLogViewer from './components/AuditLogViewer';
import DatasetsHub from './components/DatasetsHub';
import ReportsHub from './components/ReportsHub';
import { ToastProvider } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeContractId, setActiveContractId] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeContractTitle, setActiveContractTitle] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check local stored session
    const user = getSavedUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleSelectContract = (contractId, jobId = null) => {
    setActiveContractId(contractId);
    setActiveJobId(jobId);
    setActiveTab('reviewer');
  };

  const handleLoadSample = async (sampleKey, riskProfile) => {
    setLoading(true);
    try {
      const res = await api.loadSample(sampleKey, riskProfile);
      setActiveContractId(res.contract_id);
      setActiveJobId(res.job_id);
      setActiveContractTitle(res.filename);
      setActiveTab('reviewer');
    } catch (err) {
      console.error("Error loading sample:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
  };

  return (
    <ToastProvider>
      <div className="app-layout">
        <Header 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          currentContractTitle={activeContractTitle}
        />

        <main className="main-viewport">
          {activeTab === 'dashboard' && (
            <Dashboard 
              onSelectContract={handleSelectContract}
              onLoadSample={handleLoadSample}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {activeTab === 'reviewer' && (
            <Reviewer 
              contractId={activeContractId || 'cnt_sample_msa'}
              jobId={activeJobId}
              onBackToDashboard={() => setActiveTab('dashboard')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'datasets' && (
            <DatasetsHub />
          )}

          {activeTab === 'reports' && (
            <ReportsHub />
          )}

          {activeTab === 'search' && (
            <SearchHub 
              onSelectContract={handleSelectContract}
            />
          )}

          {activeTab === 'smart_contracts' && (
            <SmartContractStudio 
              selectedContractId={activeContractId}
            />
          )}

          {activeTab === 'admin' && (
            <AdminConsole 
              currentUser={currentUser}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogViewer />
          )}
        </main>

        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
          }}
        />
      </div>
    </ToastProvider>
  );
}

/**
 * LegalSight API Client
 */

const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('legalsight_token');
export const setAuthToken = (token) => localStorage.getItem('legalsight_token', token);
export const removeAuthToken = () => localStorage.removeItem('legalsight_token');

export const getSavedUser = () => {
  const u = localStorage.getItem('legalsight_user');
  return u ? JSON.parse(u) : null;
};

export const saveUser = (user) => {
  localStorage.setItem('legalsight_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('legalsight_token');
  localStorage.removeItem('legalsight_user');
};

async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  // Handle binary/PDF responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    return response.blob();
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (userData) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => apiFetch('/auth/me'),

  // Contracts
  getSamples: () => apiFetch('/contracts/samples'),
  listContracts: () => apiFetch('/contracts'),
  getContract: (contractId) => apiFetch(`/contracts/${contractId}`),
  uploadContract: (formData) => apiFetch('/contracts/upload', { method: 'POST', body: formData }),
  loadSample: (sampleKey, riskProfile = 'Vendor Standard') => 
    apiFetch(`/contracts/load-sample/${sampleKey}?risk_profile=${encodeURIComponent(riskProfile)}`, { method: 'POST' }),

  // Analysis
  getJobState: (jobId) => apiFetch(`/analysis/job/${jobId}`),
  reEvaluateProfile: (jobId, riskProfile) => 
    apiFetch(`/analysis/job/${jobId}/re-evaluate`, { method: 'POST', body: JSON.stringify({ risk_profile: riskProfile }) }),
  approveClause: (jobId, clauseId, notes = '') => 
    apiFetch(`/analysis/job/${jobId}/clause/${clauseId}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),
  updateRedline: (jobId, clauseId, replacementText, rationale) =>
    apiFetch(`/analysis/job/${jobId}/clause/${clauseId}/redline`, { method: 'POST', body: JSON.stringify({ replacement_text: replacementText, rationale }) }),
  finalizeReview: (jobId, actor = 'Lead Legal Counsel') => 
    apiFetch(`/analysis/job/${jobId}/finalize`, { method: 'POST', body: JSON.stringify({ actor }) }),

  // Exports
  exportPdfUrl: (jobOrContractId) => `${API_BASE}/export/pdf/${jobOrContractId}`,
  exportJson: (jobOrContractId) => apiFetch(`/export/summary/${jobOrContractId}`),

  // Search & Stubs
  search: (query, category, riskLevel) => {
    let url = `/search?q=${encodeURIComponent(query)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (riskLevel) url += `&risk_level=${encodeURIComponent(riskLevel)}`;
    return apiFetch(url);
  },
  
  // Smart Contracts
  draftSmartContract: (contractId) => apiFetch(`/smart-contracts/draft/${contractId}`, { method: 'POST' }),
  deploySmartContract: (contractId, gasLimit = 2500000) => apiFetch(`/smart-contracts/deploy/${contractId}`, { method: 'POST', body: JSON.stringify({ gas_limit: gasLimit }) }),
  getSmartContractStatus: (contractId) => apiFetch(`/smart-contracts/status/${contractId}`),

  // Admin & Reports
  getAdminUsers: () => apiFetch('/admin/users'),
  getPlaybooks: () => apiFetch('/admin/playbooks'),
  getModelStatus: () => apiFetch('/admin/models/fine-tuning'),
  getPortfolioReport: () => apiFetch('/reports/portfolio'),
  getDeadlines: () => apiFetch('/reports/deadlines'),

  // Audit Logs
  getAuditEvents: (contractId = null) => apiFetch(contractId ? `/audit/events?contract_id=${contractId}` : '/audit/events')
};
